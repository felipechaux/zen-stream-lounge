'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Video, VideoOff, PhoneOff, Loader2, Lock, X, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useViewerSignaling } from '@/hooks/usePrivateCallSignaling'
import AntMediaProvider, { useAntMedia } from './AntMediaProvider'

// ── Derive or restore a stable anonymous viewer ID ───────────────────────────
function getViewerId(userId?: string): string {
  if (userId) return userId
  const key = 'zen-viewer-id'
  const existing =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null
  if (existing) return existing
  const id = `anon-${Math.random().toString(36).slice(2, 10)}`
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, id)
  return id
}

// ── Local camera tile (inside publisher AntMediaProvider) ────────────────────
function LocalCallTile({
  streamId,
  onReady,
}: {
  streamId: string
  onReady: () => void
}) {
  const { isConnected, publish, stop } = useAntMedia()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (isConnected && !active) {
      publish(streamId)
      setActive(true)
      onReady()
    }
    return () => { if (active) stop(streamId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/[0.07] flex-1 min-w-0">
      <video id="localVideo-priv" autoPlay muted playsInline className="w-full h-full object-cover" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white font-medium border border-white/[0.08]">
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
        You
      </div>
    </div>
  )
}

// ── Remote camera tile (inside player AntMediaProvider) ──────────────────────
function RemoteCallTile({ streamId }: { streamId: string }) {
  const { isConnected, play, stop } = useAntMedia()
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (isConnected && !started) {
      play(streamId)
      setStarted(true)
    }
    return () => { if (started) stop(streamId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/[0.07] flex-1 min-w-0">
      <video id="remoteVideo-priv" autoPlay playsInline className="w-full h-full object-cover" />
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/80">
          <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
          <span className="text-zinc-500 text-xs">Connecting to streamer…</span>
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white font-medium border border-white/[0.08]">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Streamer
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface PrivateCallViewerProps {
  streamId: string // the streamer's broadcast stream ID (from URL param)
}

export default function PrivateCallViewer({ streamId }: PrivateCallViewerProps) {
  const { user, profile } = useAuth()

  const viewerId = useMemo(
    () => getViewerId(user?.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  )

  const displayName = profile?.full_name ?? (user?.email?.split('@')[0]) ?? 'Guest'

  const { status, ready, sendRequest, cancel, endCall } = useViewerSignaling(
    streamId,
    viewerId,
    displayName,
  )

  // WebRTC stream IDs — both sides derive these from the same streamId + viewerId
  const hostStreamId   = `priv-${streamId}-host`
  const viewerStreamId = `priv-${streamId}-viewer-${viewerId}`

  // ── Unauthenticated — prompt to sign in ──────────────────────────────────
  if (!user) {
    return (
      <div
        className="flex items-center justify-between px-5 py-4 rounded-2xl border border-white/[0.06] mt-5"
        style={{ background: 'var(--glass-bg)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Lock className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Private Call</p>
            <p className="text-zinc-500 text-xs">Sign in to request a one-on-one session with the streamer</p>
          </div>
        </div>
        <Link
          href={`/auth?mode=login&redirect=/streaming?mode=play%26id=${streamId}`}
          className="flex items-center gap-2 h-9 px-5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-white/[0.08] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in
        </Link>
      </div>
    )
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (status === 'idle' || status === 'rejected') {
    return (
      <div
        className="flex items-center justify-between px-5 py-4 rounded-2xl border border-white/[0.06] mt-5"
        style={{ background: 'var(--glass-bg)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Private Call</p>
            {status === 'rejected' ? (
              <p className="text-red-400 text-xs">Request declined. Try again?</p>
            ) : (
              <p className="text-zinc-500 text-xs">Request a one-on-one session with the streamer</p>
            )}
          </div>
        </div>
        <button
          onClick={sendRequest}
          disabled={!ready}
          className="flex items-center gap-2 h-9 px-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Video className="h-3.5 w-3.5" />
          {ready ? 'Request' : 'Connecting…'}
        </button>
      </div>
    )
  }

  // ── Pending ───────────────────────────────────────────────────────────────
  if (status === 'pending') {
    return (
      <div
        className="flex items-center justify-between px-5 py-4 rounded-2xl border border-amber-500/20 mt-5"
        style={{ background: 'rgba(245,158,11,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-amber-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Waiting for streamer…</p>
            <p className="text-zinc-500 text-xs">Your request has been sent</p>
          </div>
        </div>
        <button
          onClick={cancel}
          className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-medium text-sm border border-white/[0.07] transition-all duration-200 flex-shrink-0"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    )
  }

  // ── In call ───────────────────────────────────────────────────────────────
  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white text-sm font-medium">Private Call Active</span>
        </div>
        <button
          onClick={endCall}
          className="flex items-center gap-2 h-9 px-5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all duration-200"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          End Call
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <AntMediaProvider role="publisher" localVideoId="localVideo-priv">
          <LocalCallTile streamId={viewerStreamId} onReady={() => {}} />
        </AntMediaProvider>
        <AntMediaProvider role="player" remoteVideoId="remoteVideo-priv">
          <RemoteCallTile streamId={hostStreamId} />
        </AntMediaProvider>
      </div>
    </div>
  )
}
