'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Send, MessageCircle, LogIn, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLiveChat, ChatMessage } from '@/hooks/useLiveChat'

// streamId is the streamer's broadcast id, formatted "host-{userId.slice(0,12)}".
// We use this to flag the streamer's messages with a "Host" badge without
// needing to fetch the full streamer user id from the server.
function isStreamerMessage(streamId: string, userId: string): boolean {
  if (!streamId.startsWith('host-')) return false
  const prefix = streamId.slice(5)
  return prefix.length > 0 && userId.startsWith(prefix)
}

function MessageRow({
  message,
  isOwn,
  isHost,
}: {
  message: ChatMessage
  isOwn: boolean
  isHost: boolean
}) {
  const initial = (message.display_name?.[0] ?? '?').toUpperCase()

  return (
    <div className="flex gap-2.5 items-start">
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${
          isHost
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            : 'bg-white/[0.05] border-white/[0.08] text-zinc-300'
        }`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-xs font-semibold truncate ${isOwn ? 'text-amber-300' : 'text-zinc-300'}`}>
            {message.display_name}
          </span>
          {isHost && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1 py-px">
              Host
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-200 break-words whitespace-pre-wrap leading-snug">
          {message.body}
        </p>
      </div>
    </div>
  )
}

interface LiveChatProps {
  streamId: string
  /** Optional fixed height for the panel. Defaults to 'h-[500px]'. */
  className?: string
}

export default function LiveChat({ streamId, className }: LiveChatProps) {
  const { user, profile } = useAuth()

  const displayName = useMemo(
    () => profile?.full_name ?? user?.email?.split('@')[0] ?? 'User',
    [profile?.full_name, user?.email]
  )

  const { messages, send, ready, canChat } = useLiveChat(
    streamId,
    user?.id ?? null,
    displayName,
  )

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  // Track whether the user is "at bottom" so new messages auto-scroll only
  // when they're already following the live tail.
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < 80
  }

  useEffect(() => {
    if (!stickToBottomRef.current) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    const body = draft
    setDraft('')
    stickToBottomRef.current = true
    await send(body)
    setSending(false)
  }

  return (
    <div
      className={`rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col ${className ?? 'h-[500px]'}`}
      style={{ background: 'var(--glass-bg)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-amber-500" />
          <p className="text-white text-sm font-semibold">Live Chat</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-zinc-500 text-xs">{ready ? 'Live' : 'Connecting…'}</span>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center py-10">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-xs font-medium">No messages yet</p>
            <p className="text-zinc-600 text-xs max-w-[200px]">Say hi — be the first to chat.</p>
          </div>
        ) : (
          messages.map(m => (
            <MessageRow
              key={m.id}
              message={m}
              isOwn={!!user && m.user_id === user.id}
              isHost={isStreamerMessage(streamId, m.user_id)}
            />
          ))
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
        {canChat ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Send a message…"
              maxLength={500}
              disabled={!ready || sending}
              className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !ready || sending}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 min-w-0">
              <Lock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Sign in to send messages</span>
            </div>
            <Link
              href={`/auth?mode=login&redirect=/streaming?mode=play%26id=${streamId}`}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-white/[0.08] transition-all duration-200 flex-shrink-0"
            >
              <LogIn className="h-3 w-3" />
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
