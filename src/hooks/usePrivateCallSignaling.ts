'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'

// DB row shape (matches call_requests table)
export type CallRequest = {
  id: string
  stream_id: string
  viewer_id: string
  viewer_name: string
  status: 'pending' | 'accepted' | 'streaming' | 'rejected' | 'ended'
  created_at: string
}

export type ViewerCallStatus = 'idle' | 'pending' | 'in-call' | 'rejected'

// ── Keepalive PATCH ──────────────────────────────────────────────────────────
// Fires a fetch with keepalive:true so the request survives tab close / refresh.
// Used in pagehide handlers — supabase-js doesn't set keepalive on its updates.
function sendEndCallBeacon(rowId: string, accessToken: string | null) {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!rowId || !url || !anonKey || !accessToken) return
  try {
    fetch(`${url}/rest/v1/call_requests?id=eq.${rowId}`, {
      method: 'PATCH',
      keepalive: true,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ status: 'ended' }),
    }).catch(() => {})
  } catch {
    // best-effort; nothing else to do
  }
}

// ── Streamer side ────────────────────────────────────────────────────────────
// Listens for new rows in call_requests WHERE stream_id = streamId via CDC.
// Accepts / rejects by UPDATEing the row's status.

export function useStreamerSignaling(streamId: string) {
  const [pending, setPending]       = useState<CallRequest[]>([])
  const [activeCall, setActiveCall] = useState<CallRequest | null>(null)
  const [ready, setReady]           = useState(false)
  const channelRef    = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const signalChanRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeCallRef = useRef<CallRequest | null>(null)
  const tokenRef      = useRef<string | null>(null)

  // Keep ref in sync with state so pagehide can read the latest active call
  useEffect(() => { activeCallRef.current = activeCall }, [activeCall])

  // Merge fetched rows into pending — adds new ones, removes no-longer-pending ones
  const syncPending = useCallback((rows: CallRequest[]) => {
    setPending(rows.filter(r => r.status === 'pending'))
  }, [])

  useEffect(() => {
    if (!streamId) return

    setReady(false)
    const supabase = createClient()

    // Track access token so the pagehide beacon can authenticate
    supabase.auth.getSession().then(({ data }) => {
      tokenRef.current = data.session?.access_token ?? null
    })
    const { data: authSub } = supabase.auth.onAuthStateChange((_evt, session) => {
      tokenRef.current = session?.access_token ?? null
    })

    const fetchPending = () =>
      supabase
        .from('call_requests')
        .select('*')
        .eq('stream_id', streamId)
        .eq('status', 'pending')
        .then(({ data }) => { if (data) syncPending(data as CallRequest[]) })

    fetchPending()

    // Poll every 8 seconds as a fallback for missed Realtime events
    pollRef.current = setInterval(fetchPending, 8000)

    const ch = supabase
      .channel(`streamer-calls:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_requests',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const row = payload.new as CallRequest
          if (row.status !== 'pending') return
          setPending(prev =>
            prev.find(r => r.id === row.id) ? prev : [...prev, row]
          )
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_requests',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const row = payload.new as CallRequest
          if (row.status === 'ended' || row.status === 'rejected') {
            setPending(prev => prev.filter(r => r.id !== row.id))
            setActiveCall(prev => prev?.id === row.id ? null : prev)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchPending()
        setReady(status === 'SUBSCRIBED')
      })

    channelRef.current = ch

    // Redundant fast-path: a stream-scoped broadcast channel both sides join.
    // When either side ends the call they broadcast 'ended' so the other side
    // clears its UI without waiting on Postgres CDC.
    const signalCh = supabase
      .channel(`private-call-signals:${streamId}`, { config: { broadcast: { ack: false } } })
      .on('broadcast', { event: 'ended' }, (payload) => {
        const requestId = (payload?.payload as { requestId?: string } | undefined)?.requestId
        if (!requestId) return
        setPending(prev => prev.filter(r => r.id !== requestId))
        setActiveCall(prev => prev?.id === requestId ? null : prev)
      })
      .subscribe()

    signalChanRef.current = signalCh

    // Last-resort cleanup: if the tab closes mid-call, mark the row as ended
    // so the viewer's UI can react via realtime UPDATE event.
    const onPageHide = () => {
      const id = activeCallRef.current?.id
      if (id) sendEndCallBeacon(id, tokenRef.current)
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      setReady(false)
      window.removeEventListener('pagehide', onPageHide)
      authSub.subscription.unsubscribe()
      if (pollRef.current) clearInterval(pollRef.current)

      // SPA navigation / parent unmount: fire-and-forget end if call was active
      const id = activeCallRef.current?.id
      if (id) {
        signalCh.send({ type: 'broadcast', event: 'ended', payload: { requestId: id } }).catch(() => {})
        supabase
          .from('call_requests')
          .update({ status: 'ended' })
          .eq('id', id)
          .then(() => {})
      }

      supabase.removeChannel(ch)
      supabase.removeChannel(signalCh)
    }
  }, [streamId, syncPending])

  const accept = useCallback(async (req: CallRequest) => {
    const supabase = createClient()
    await supabase
      .from('call_requests')
      .update({ status: 'accepted' })
      .eq('id', req.id)

    setActiveCall(req)
    setPending(prev => prev.filter(r => r.id !== req.id))
  }, [])

  const reject = useCallback(async (reqId: string) => {
    const supabase = createClient()
    await supabase
      .from('call_requests')
      .update({ status: 'rejected' })
      .eq('id', reqId)

    setPending(prev => prev.filter(r => r.id !== reqId))
  }, [])

  const endCall = useCallback(async () => {
    const current = activeCallRef.current
    if (!current) return
    setActiveCall(null)
    // Broadcast first (fast path); other side clears UI without waiting on CDC.
    const signalCh = signalChanRef.current
    if (signalCh) {
      signalCh
        .send({ type: 'broadcast', event: 'ended', payload: { requestId: current.id } })
        .catch(() => {})
    }
    const supabase = createClient()
    await supabase
      .from('call_requests')
      .update({ status: 'ended' })
      .eq('id', current.id)
  }, [])

  return { pending, activeCall, ready, accept, reject, endCall }
}

// ── Viewer side ──────────────────────────────────────────────────────────────
// INSERTs a row then listens for UPDATE on that specific row via CDC.

export function useViewerSignaling(
  streamId: string,
  viewerId: string,
  displayName: string,
) {
  const [status, setStatus]         = useState<ViewerCallStatus>('idle')
  const [ready, setReady]           = useState(false)
  const requestIdRef                = useRef<string | null>(null)
  const statusRef                   = useRef<ViewerCallStatus>('idle')
  const channelRef    = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const signalChanRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenRef      = useRef<string | null>(null)

  // Keep statusRef in sync so the poll/pagehide callbacks can read current status
  const applyStatus = useCallback((next: ViewerCallStatus) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  useEffect(() => {
    if (!streamId || !viewerId) return

    setReady(false)
    const supabase = createClient()

    // Track access token for the pagehide beacon
    supabase.auth.getSession().then(({ data }) => {
      tokenRef.current = data.session?.access_token ?? null
    })
    const { data: authSub } = supabase.auth.onAuthStateChange((_evt, session) => {
      tokenRef.current = session?.access_token ?? null
    })

    const applyRow = (row: CallRequest) => {
      if (row.stream_id !== streamId) return
      if (row.status === 'accepted' || row.status === 'streaming') applyStatus('in-call')
      else if (row.status === 'rejected') applyStatus('rejected')
      else if (row.status === 'ended') applyStatus('idle')
    }

    const fetchCurrentRow = () =>
      supabase
        .from('call_requests')
        .select('*')
        .eq('viewer_id', viewerId)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) {
            requestIdRef.current = requestIdRef.current ?? data.id
            applyRow(data as CallRequest)
          }
        })

    // Poll every 5 seconds while pending — catches missed Realtime UPDATE events
    pollRef.current = setInterval(() => {
      if (statusRef.current === 'pending') fetchCurrentRow()
    }, 5000)

    const ch = supabase
      .channel(`viewer-call:${streamId}:${viewerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_requests',
          filter: `viewer_id=eq.${viewerId}`,
        },
        (payload) => applyRow(payload.new as CallRequest),
      )
      .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') await fetchCurrentRow()
        setReady(s === 'SUBSCRIBED')
      })

    channelRef.current = ch

    // Redundant fast-path broadcast channel — both sides join this and broadcast
    // 'ended' on call end so the other side clears UI without waiting on CDC.
    const signalCh = supabase
      .channel(`private-call-signals:${streamId}`, { config: { broadcast: { ack: false } } })
      .on('broadcast', { event: 'ended' }, (payload) => {
        const requestId = (payload?.payload as { requestId?: string } | undefined)?.requestId
        if (!requestId) return
        if (requestIdRef.current === requestId) {
          requestIdRef.current = null
          applyStatus('idle')
        }
      })
      .subscribe()

    signalChanRef.current = signalCh

    // Tab close / refresh mid-call: notify the streamer via keepalive PATCH
    const onPageHide = () => {
      const id = requestIdRef.current
      if (id && (statusRef.current === 'pending' || statusRef.current === 'in-call')) {
        sendEndCallBeacon(id, tokenRef.current)
      }
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      setReady(false)
      window.removeEventListener('pagehide', onPageHide)
      authSub.subscription.unsubscribe()
      if (pollRef.current) clearInterval(pollRef.current)

      // SPA navigation: end any pending/active request so the streamer's UI clears
      const id = requestIdRef.current
      if (id && (statusRef.current === 'pending' || statusRef.current === 'in-call')) {
        signalCh.send({ type: 'broadcast', event: 'ended', payload: { requestId: id } }).catch(() => {})
        supabase
          .from('call_requests')
          .update({ status: 'ended' })
          .eq('id', id)
          .then(() => {})
      }

      supabase.removeChannel(ch)
      supabase.removeChannel(signalCh)
    }
  }, [streamId, viewerId, applyStatus])

  const sendRequest = useCallback(async () => {
    if (!ready) return
    const supabase = createClient()

    // Cancel any stale pending row first
    if (requestIdRef.current) {
      await supabase
        .from('call_requests')
        .update({ status: 'ended' })
        .eq('id', requestIdRef.current)
      requestIdRef.current = null
    }

    const { data, error } = await supabase
      .from('call_requests')
      .insert({
        stream_id:   streamId,
        viewer_id:   viewerId,
        viewer_name: displayName,
        status:      'pending',
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[PrivateCall] Failed to insert request:', error)
      return
    }

    requestIdRef.current = data.id
    applyStatus('pending')
  }, [streamId, viewerId, displayName, ready, applyStatus])

  const cancel = useCallback(async () => {
    if (!requestIdRef.current) { applyStatus('idle'); return }
    const supabase = createClient()
    const id = requestIdRef.current
    requestIdRef.current = null
    applyStatus('idle')
    const signalCh = signalChanRef.current
    if (signalCh) {
      signalCh.send({ type: 'broadcast', event: 'ended', payload: { requestId: id } }).catch(() => {})
    }
    await supabase
      .from('call_requests')
      .update({ status: 'ended' })
      .eq('id', id)
  }, [applyStatus])

  const endCall = useCallback(async () => {
    if (!requestIdRef.current) { applyStatus('idle'); return }
    const supabase = createClient()
    const id = requestIdRef.current
    requestIdRef.current = null
    applyStatus('idle')
    const signalCh = signalChanRef.current
    if (signalCh) {
      signalCh.send({ type: 'broadcast', event: 'ended', payload: { requestId: id } }).catch(() => {})
    }
    await supabase
      .from('call_requests')
      .update({ status: 'ended' })
      .eq('id', id)
  }, [applyStatus])

  return { status, ready, sendRequest, cancel, endCall }
}
