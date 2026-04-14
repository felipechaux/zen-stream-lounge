'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'

// DB row shape (matches call_requests table)
export type CallRequest = {
  id: string
  stream_id: string
  viewer_id: string
  viewer_name: string
  status: 'pending' | 'accepted' | 'rejected' | 'ended'
  created_at: string
}

export type ViewerCallStatus = 'idle' | 'pending' | 'in-call' | 'rejected'

// ── Streamer side ────────────────────────────────────────────────────────────
// Listens for new rows in call_requests WHERE stream_id = streamId via CDC.
// Accepts / rejects by UPDATEing the row's status.

export function useStreamerSignaling(streamId: string) {
  const [pending, setPending]       = useState<CallRequest[]>([])
  const [activeCall, setActiveCall] = useState<CallRequest | null>(null)
  const [ready, setReady]           = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!streamId) return

    setReady(false)
    const supabase = createClient()

    const ch = supabase
      .channel(`streamer-calls:${streamId}`)
      // New pending requests arriving
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
            prev.find(r => r.viewer_id === row.viewer_id) ? prev : [...prev, row]
          )
        },
      )
      // Viewer cancels their pending request
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
          if (row.status === 'ended') {
            setPending(prev => prev.filter(r => r.id !== row.id))
            setActiveCall(prev => prev?.id === row.id ? null : prev)
          }
        },
      )
      .subscribe((status) => {
        setReady(status === 'SUBSCRIBED')
      })

    channelRef.current = ch

    return () => {
      setReady(false)
      supabase.removeChannel(ch)
    }
  }, [streamId])

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
    if (!activeCall) return
    const supabase = createClient()
    await supabase
      .from('call_requests')
      .update({ status: 'ended' })
      .eq('id', activeCall.id)

    setActiveCall(null)
  }, [activeCall])

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
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!streamId || !viewerId) return

    setReady(false)
    const supabase = createClient()

    // Subscribe to updates on our own viewer_id rows for this stream
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
        (payload) => {
          const row = payload.new as CallRequest
          if (row.stream_id !== streamId) return
          if (row.status === 'accepted') setStatus('in-call')
          else if (row.status === 'rejected') setStatus('rejected')
          else if (row.status === 'ended') setStatus('idle')
        },
      )
      .subscribe((s) => {
        setReady(s === 'SUBSCRIBED')
      })

    channelRef.current = ch

    return () => {
      setReady(false)
      supabase.removeChannel(ch)
    }
  }, [streamId, viewerId])

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
    setStatus('pending')
  }, [streamId, viewerId, displayName, ready])

  const cancel = useCallback(async () => {
    if (!requestIdRef.current) { setStatus('idle'); return }
    const supabase = createClient()
    await supabase
      .from('call_requests')
      .update({ status: 'ended' })
      .eq('id', requestIdRef.current)
    requestIdRef.current = null
    setStatus('idle')
  }, [])

  const endCall = useCallback(async () => {
    if (!requestIdRef.current) { setStatus('idle'); return }
    const supabase = createClient()
    await supabase
      .from('call_requests')
      .update({ status: 'ended' })
      .eq('id', requestIdRef.current)
    requestIdRef.current = null
    setStatus('idle')
  }, [])

  return { status, ready, sendRequest, cancel, endCall }
}
