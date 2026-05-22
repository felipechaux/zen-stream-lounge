'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export type ChatMessage = {
  id: string
  stream_id: string
  user_id: string
  display_name: string
  body: string
  kind: 'text' | 'tip' | 'system'
  amount: number | null
  deleted_at: string | null
  deleted_by: string | null
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
  const [mutedUserIds, setMutedUserIds] = useState<Set<string>>(new Set())
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

    // Load muted users in this stream
    supabase
      .from('chat_mutes')
      .select('user_id')
      .eq('stream_id', streamId)
      .then(({ data }) => {
        if (cancelled || !data) return
        setMutedUserIds(new Set(data.map(m => m.user_id)))
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
      .on('broadcast', { event: 'delete' }, (payload) => {
        const { id, deleted_at, deleted_by } = payload?.payload || {}
        if (!id) return
        setMessages(prev =>
          prev.map(m => m.id === id ? { ...m, deleted_at, deleted_by } : m)
        )
      })
      .on('broadcast', { event: 'mute' }, (payload) => {
        const { user_id } = payload?.payload || {}
        if (!user_id) return
        setMutedUserIds(prev => {
          const next = new Set(prev)
          next.add(user_id)
          return next
        })
      })
      .on('broadcast', { event: 'unmute' }, (payload) => {
        const { user_id } = payload?.payload || {}
        if (!user_id) return
        setMutedUserIds(prev => {
          const next = new Set(prev)
          next.delete(user_id)
          return next
        })
      })
      .subscribe((s) => setReady(s === 'SUBSCRIBED'))

    channelRef.current = ch

    return () => {
      cancelled = true
      setReady(false)
      supabase.removeChannel(ch)
    }
  }, [streamId])

  const send = useCallback(async (
    rawBody: string,
    kind: 'text' | 'tip' | 'system' = 'text',
    amount: number | null = null
  ) => {
    if (!currentUserId || !streamId) return
    
    // Check if user is muted locally
    if (mutedUserIds.has(currentUserId)) {
      console.warn('[LiveChat] Cannot send message: User is muted')
      return
    }

    const body = rawBody.trim().slice(0, MAX_BODY)
    if (!body && kind !== 'tip') return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        stream_id:    streamId,
        user_id:      currentUserId,
        display_name: currentDisplayName,
        body,
        kind,
        amount,
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
  }, [streamId, currentUserId, currentDisplayName, mutedUserIds])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentUserId) return
    const deleted_at = new Date().toISOString()
    const supabase = createClient()
    
    const { error } = await supabase
      .from('chat_messages')
      .update({
        deleted_at,
        deleted_by: currentUserId,
      })
      .eq('id', messageId)

    if (error) {
      console.error('[LiveChat] Failed to delete message:', error)
      return
    }

    // Update local state
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, deleted_at, deleted_by: currentUserId } : m)
    )

    // Broadcast delete event to other users
    channelRef.current
      ?.send({
        type: 'broadcast',
        event: 'delete',
        payload: { id: messageId, deleted_at, deleted_by: currentUserId }
      })
      .catch(() => {})
  }, [currentUserId])

  const muteUser = useCallback(async (targetUserId: string) => {
    if (!currentUserId || !streamId) return
    const supabase = createClient()

    const { error } = await supabase
      .from('chat_mutes')
      .insert({
        stream_id: streamId,
        user_id: targetUserId,
        muted_by: currentUserId,
      })

    if (error) {
      console.error('[LiveChat] Failed to mute user:', error)
      return
    }

    // Update local state
    setMutedUserIds(prev => {
      const next = new Set(prev)
      next.add(targetUserId)
      return next
    })

    // Broadcast mute event to other users
    channelRef.current
      ?.send({
        type: 'broadcast',
        event: 'mute',
        payload: { user_id: targetUserId, muted_by: currentUserId }
      })
      .catch(() => {})
  }, [streamId, currentUserId])

  const unmuteUser = useCallback(async (targetUserId: string) => {
    if (!currentUserId || !streamId) return
    const supabase = createClient()

    const { error } = await supabase
      .from('chat_mutes')
      .delete()
      .eq('stream_id', streamId)
      .eq('user_id', targetUserId)

    if (error) {
      console.error('[LiveChat] Failed to unmute user:', error)
      return
    }

    // Update local state
    setMutedUserIds(prev => {
      const next = new Set(prev)
      next.delete(targetUserId)
      return next
    })

    // Broadcast unmute event to other users
    channelRef.current
      ?.send({
        type: 'broadcast',
        event: 'unmute',
        payload: { user_id: targetUserId }
      })
      .catch(() => {})
  }, [streamId, currentUserId])

  return {
    messages,
    send,
    deleteMessage,
    muteUser,
    unmuteUser,
    mutedUserIds,
    ready,
    canChat: !!currentUserId,
  }
}
