'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export type ChatMessage = {
  id: string
  stream_id: string
  user_id: string
  display_name: string
  body: string
  created_at: string
}

const HISTORY_LIMIT = 50
const MAX_BODY = 500

// Public chat for a live stream.
// - Persists messages in chat_messages so late joiners see recent context
// - Live delivery via Supabase Realtime broadcast (lower latency than CDC)
// - Anonymous users can read but cannot send
export function useLiveChat(
  streamId: string,
  currentUserId: string | null,
  currentDisplayName: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [ready, setReady]       = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!streamId) return

    setReady(false)
    const supabase = createClient()
    let cancelled = false

    // Load recent history (oldest → newest for natural rendering)
    supabase
      .from('chat_messages')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT)
      .then(({ data }) => {
        if (cancelled || !data) return
        const rows = (data as ChatMessage[]).slice().reverse()
        setMessages(prev => {
          // Merge in any messages that arrived from broadcast before history loaded
          const seen = new Set(rows.map(m => m.id))
          const tail = prev.filter(m => !seen.has(m.id))
          return [...rows, ...tail]
        })
      })

    const ch = supabase
      .channel(`chat:${streamId}`, { config: { broadcast: { self: false, ack: false } } })
      .on('broadcast', { event: 'msg' }, (payload) => {
        const msg = payload?.payload as ChatMessage | undefined
        if (!msg?.id) return
        setMessages(prev =>
          prev.find(m => m.id === msg.id) ? prev : [...prev, msg]
        )
      })
      .subscribe((s) => setReady(s === 'SUBSCRIBED'))

    channelRef.current = ch

    return () => {
      cancelled = true
      setReady(false)
      supabase.removeChannel(ch)
    }
  }, [streamId])

  const send = useCallback(async (rawBody: string) => {
    if (!currentUserId || !streamId) return
    const body = rawBody.trim().slice(0, MAX_BODY)
    if (!body) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        stream_id:    streamId,
        user_id:      currentUserId,
        display_name: currentDisplayName,
        body,
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('[LiveChat] Failed to insert message:', error)
      return
    }

    const msg = data as ChatMessage

    // Optimistic local append (broadcast is self:false — we don't receive our own)
    setMessages(prev =>
      prev.find(m => m.id === msg.id) ? prev : [...prev, msg]
    )

    // Fast-path delivery to other subscribers
    channelRef.current
      ?.send({ type: 'broadcast', event: 'msg', payload: msg })
      .catch(() => {})
  }, [streamId, currentUserId, currentDisplayName])

  return { messages, send, ready, canChat: !!currentUserId }
}
