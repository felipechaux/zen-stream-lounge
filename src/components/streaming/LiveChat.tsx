'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Send, MessageCircle, LogIn, Lock, Trash2, ShieldAlert, ShieldOff, Smile, DollarSign } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLiveChat, ChatMessage } from '@/hooks/useLiveChat'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

// streamId is the streamer's broadcast id, formatted "host-{userId.slice(0,12)}".
// We use this to flag the streamer's messages with a "Host" badge without
// needing to fetch the full streamer user id from the server.
function isStreamerMessage(streamId: string, userId: string): boolean {
  if (!streamId.startsWith('host-')) return false
  const prefix = streamId.slice(5)
  return prefix.length > 0 && userId.startsWith(prefix)
}

function formatMessageBody(body: string) {
  const regex = /(@[a-zA-Z0-9_-]+)/g
  const parts = body.split(regex)
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="text-amber-400 font-semibold cursor-pointer hover:underline">
          {part}
        </span>
      )
    }
    return part
  })
}

function MessageRow({
  message,
  isOwn,
  isHost,
  onDelete,
  onMute,
  isMuted,
  showActions,
}: {
  message: ChatMessage
  isOwn: boolean
  isHost: boolean
  onDelete?: () => void
  onMute?: () => void
  isMuted?: boolean
  showActions: boolean
}) {
  const initial = (message.display_name?.[0] ?? '?').toUpperCase()
  const isDeleted = !!message.deleted_at

  if (isDeleted) {
    return (
      <div className="flex gap-2 py-1 opacity-40 items-center select-none">
        <span className="text-xs text-zinc-500">🚫</span>
        <p className="text-xs italic text-zinc-500 font-medium">Message deleted by moderator</p>
      </div>
    )
  }

  const isTip = message.kind === 'tip'

  return (
    <div className={`group relative flex gap-2.5 items-start p-2 rounded-xl transition-all duration-200 ${
      isTip 
        ? 'bg-gradient-to-r from-amber-500/10 via-orange-600/10 to-transparent border border-amber-500/20' 
        : 'hover:bg-white/[0.02]'
    }`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
          isHost
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            : isTip
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400/50 text-black'
            : 'bg-white/[0.05] border-white/[0.08] text-zinc-300'
        }`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0 pr-8 lg:pr-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-xs font-semibold truncate ${
            isTip ? 'text-amber-300 font-bold' : isOwn ? 'text-amber-400' : 'text-zinc-300'
          }`}>
            {message.display_name}
          </span>
          {isHost && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1 py-px select-none">
              Host
            </span>
          )}
          {isTip && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded px-1.5 py-0.5 shadow-sm select-none">
              Tip ${message.amount}
            </span>
          )}
        </div>
        <p className={`text-sm break-words whitespace-pre-wrap leading-snug mt-0.5 ${
          isTip ? 'text-amber-100 font-medium' : 'text-zinc-200'
        }`}>
          {formatMessageBody(message.body)}
        </p>
      </div>

      {/* Moderation Actions overlay on hover (desktop) / always visible at lower opacity (mobile/touch devices) */}
      {showActions && !isOwn && !isHost && (
        <div className="absolute right-2 top-2 flex lg:hidden lg:group-hover:flex items-center gap-1 bg-zinc-950/90 backdrop-blur border border-white/[0.08] rounded-lg p-1 shadow-lg z-10 opacity-75 lg:opacity-100 hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            title="Delete Message"
            className="p-1 text-zinc-400 hover:text-red-400 hover:bg-white/[0.05] rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMute}
            title={isMuted ? "Unmute User" : "Mute User"}
            className={`p-1 rounded transition-colors ${
              isMuted 
                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10' 
                : 'text-zinc-400 hover:text-amber-400 hover:bg-white/[0.05]'
            }`}
          >
            {isMuted ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  )
}

interface LiveChatProps {
  streamId: string
  /** Optional fixed height for the panel. Defaults to 'h-[500px]'. */
  className?: string
}

function getMentionQuery(text: string, selectionStart: number): string | null {
  const beforeCursor = text.slice(0, selectionStart)
  const lastAtIdx = beforeCursor.lastIndexOf('@')
  if (lastAtIdx === -1) return null
  
  // Verify there is no space after the '@' up to the cursor
  const textAfterAt = beforeCursor.slice(lastAtIdx + 1)
  if (textAfterAt.includes(' ')) return null
  
  return textAfterAt
}

export default function LiveChat({ streamId, className }: LiveChatProps) {
  const { user, profile } = useAuth()

  const displayName = useMemo(
    () => profile?.full_name ?? user?.email?.split('@')[0] ?? 'User',
    [profile?.full_name, user?.email]
  )

  const { 
    messages, 
    send, 
    deleteMessage, 
    muteUser, 
    unmuteUser, 
    mutedUserIds, 
    ready, 
    canChat 
  } = useLiveChat(
    streamId,
    user?.id ?? null,
    displayName,
  )

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  // Modals & Popovers state
  const [mounted, setMounted] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showTipPopover, setShowTipPopover] = useState(false)
  const [tipAmount, setTipAmount] = useState('5')
  const [tipMessage, setTipMessage] = useState('')
  const [sendingTip, setSendingTip] = useState(false)

  // Mentions autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)

  const emojiRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false)
      }
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) {
        setShowTipPopover(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isCurrentUserHost = useMemo(
    () => !!user && isStreamerMessage(streamId, user.id),
    [streamId, user]
  )

  const isCurrentMuted = useMemo(
    () => !!user && mutedUserIds.has(user.id),
    [user, mutedUserIds]
  )

  const activeChatters = useMemo(() => {
    const chatters = new Map<string, string>() // userId -> display_name
    messages.forEach(m => {
      if (m.user_id !== user?.id && !m.deleted_at) {
        chatters.set(m.user_id, m.display_name)
      }
    })
    return Array.from(chatters.entries()).map(([id, name]) => ({ id, name }))
  }, [messages, user?.id])

  const filteredChatters = useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return activeChatters.filter(c => c.name.toLowerCase().startsWith(q))
  }, [mentionQuery, activeChatters])

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

  const handleInputChange = (val: string) => {
    setDraft(val)
    const input = inputRef.current
    if (!input) return
    const selection = input.selectionStart ?? 0
    
    // Check if the user is typing a mention
    const query = getMentionQuery(val, selection)
    if (query !== null) {
      setMentionQuery(query)
      const lastAt = val.slice(0, selection).lastIndexOf('@')
      setMentionIndex(lastAt)
      setSelectedSuggestionIndex(0)
    } else {
      setMentionQuery(null)
      setMentionIndex(-1)
    }
  }

  const selectMention = (name: string) => {
    if (mentionIndex === -1) return
    const input = inputRef.current
    const selection = input?.selectionStart ?? 0
    const beforeAt = draft.substring(0, mentionIndex)
    const afterCursor = draft.substring(selection)
    
    // Remove space characters from display name for the mention string representation
    const sanitizedName = name.replace(/\s+/g, '')
    const completed = beforeAt + `@${sanitizedName} `
    setDraft(completed + afterCursor)
    setMentionQuery(null)
    setMentionIndex(-1)
    
    setTimeout(() => {
      if (input) {
        input.focus()
        const newCursorPos = completed.length
        input.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current
    if (!input) {
      setDraft(prev => prev + emoji)
      return
    }

    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const text = input.value
    const before = text.substring(0, start)
    const after = text.substring(end)

    setDraft(before + emoji + after)
    setShowEmoji(false)

    setTimeout(() => {
      input.focus()
      const newCursorPos = start + emoji.length
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleSendTip = async () => {
    const amt = parseFloat(tipAmount)
    if (isNaN(amt) || amt <= 0 || sendingTip) return
    setSendingTip(true)
    const msg = tipMessage.trim() || `Tipped $${amt}!`
    
    stickToBottomRef.current = true
    await send(msg, 'tip', amt)
    
    setTipMessage('')
    setShowTipPopover(false)
    setSendingTip(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && filteredChatters.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => (prev + 1) % filteredChatters.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => (prev - 1 + filteredChatters.length) % filteredChatters.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        selectMention(filteredChatters[selectedSuggestionIndex].name)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setMentionQuery(null)
      }
    }
  }

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
      className={`rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col relative ${className ?? 'h-[500px]'}`}
      style={{ background: 'var(--glass-bg)' }}
    >
      {/* CSS overrides to make the emoji-picker component responsive and size-constrained */}
      <style>{`
        em-emoji-picker {
          --width: 100%;
          --category-icon-size: 16px;
          --font-size: 13px;
          --emoji-size: 20px;
          width: 100% !important;
          height: 280px !important;
          max-height: 280px !important;
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0 z-10">
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
              onDelete={() => deleteMessage(m.id)}
              onMute={() => mutedUserIds.has(m.user_id) ? unmuteUser(m.user_id) : muteUser(m.user_id)}
              isMuted={mutedUserIds.has(m.user_id)}
              showActions={isCurrentUserHost}
            />
          ))
        )}
      </div>

      {/* Floating Popovers */}

      {/* Emoji Picker Popover */}
      {showEmoji && mounted && (
        <div
          ref={emojiRef}
          className="absolute bottom-16 left-2 right-2 z-50 shadow-2xl border border-white/[0.08] rounded-2xl overflow-hidden bg-zinc-950/95 backdrop-blur-md"
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji: any) => handleEmojiSelect(emoji.native)}
            theme="dark"
            set="native"
            perLine={8}
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}

      {/* Mentions autocomplete dropdown */}
      {mentionQuery !== null && filteredChatters.length > 0 && (
        <div className="absolute bottom-16 left-2 right-2 z-50 max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-zinc-950/95 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5">
          <div className="px-2 py-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider select-none">Mention user</div>
          {filteredChatters.map((chatter, idx) => (
            <button
              key={chatter.id}
              type="button"
              onClick={() => selectMention(chatter.name)}
              onMouseEnter={() => setSelectedSuggestionIndex(idx)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                idx === selectedSuggestionIndex
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px] font-bold select-none">
                {chatter.name[0].toUpperCase()}
              </span>
              <span className="truncate">{chatter.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tipping Popover */}
      {showTipPopover && (
        <div
          ref={tipRef}
          className="absolute bottom-16 left-2 right-2 z-50 p-4 rounded-xl border border-amber-500/30 bg-zinc-900/95 backdrop-blur-md shadow-2xl space-y-3"
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <DollarSign className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="text-sm font-bold text-white">Support Host</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 20].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setTipAmount(val.toString())}
                className={`h-8 rounded-lg font-bold text-xs border transition-all ${
                  tipAmount === val.toString()
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-semibold">Custom Amount ($)</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500"
              placeholder="Enter custom amount"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-semibold">Support Message</label>
            <input
              type="text"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-amber-500"
              placeholder="Say something nice..."
              maxLength={100}
            />
          </div>

          <button
            type="button"
            onClick={handleSendTip}
            disabled={!tipAmount || Number(tipAmount) <= 0 || sendingTip}
            className="w-full h-9 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sendingTip ? 'Sending...' : `Send $${tipAmount || '0'} Tip`}
          </button>
        </div>
      )}

      {/* Muted User Banner */}
      {isCurrentMuted && (
        <div className="bg-red-950/40 border-t border-red-500/20 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0 animate-bounce" />
          <span className="text-xs font-semibold text-red-300">You have been muted in this chat.</span>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0 z-10">
        {canChat ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowEmoji(false)
                setShowTipPopover(prev => !prev)
              }}
              disabled={!ready || sending || isCurrentMuted}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 border border-white/[0.08] hover:border-amber-500/30 transition-all flex-shrink-0 disabled:opacity-40"
              aria-label="Send Tip"
              title="Send Tip"
            >
              <DollarSign className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTipPopover(false)
                setShowEmoji(prev => !prev)
              }}
              disabled={!ready || sending || isCurrentMuted}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 border border-white/[0.08] hover:border-amber-500/30 transition-all flex-shrink-0 disabled:opacity-40"
              aria-label="Insert Emoji"
              title="Insert Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <input
              type="text"
              ref={inputRef}
              value={draft}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isCurrentMuted ? "You are muted" : "Send a message…"}
              maxLength={500}
              disabled={!ready || sending || isCurrentMuted}
              className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !ready || sending || isCurrentMuted}
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
