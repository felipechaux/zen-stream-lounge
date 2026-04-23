'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Video, VideoOff, PhoneOff, Clock, UserCheck, UserX, Wifi, WifiOff, VolumeX,
} from 'lucide-react'
import { useStreamerSignaling, CallRequest } from '@/hooks/usePrivateCallSignaling'
import AntMediaProvider, { useAntMedia } from './AntMediaProvider'

// ── Streamer local tile ───────────────────────────────────────────────────────
function StreamerLocalTile({ streamId }: { streamId: string }) {
  const { isConnected, publish, stop } = useAntMedia()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (isConnected && !active) {
      publish(streamId)
      setActive(true)
    }
    return () => { if (active) stop(streamId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-white/[0.07]">
      <video id="localVideo-p2p" autoPlay muted playsInline className="w-full h-full object-cover" />
      {!active && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
          <VideoOff className="h-6 w-6 text-zinc-700" />
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white border border-white/[0.08]">
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
        You
      </div>
      <div className="absolute top-2 right-2">
        {isConnected
          ? <Wifi className="h-3 w-3 text-emerald-400" />
          : <WifiOff className="h-3 w-3 text-zinc-600" />
        }
      </div>
    </div>
  )
}

// ── Viewer remote tile ────────────────────────────────────────────────────────
function ViewerRemoteTile({ streamId, displayName }: { streamId: string; displayName: string }) {
  const { isConnected, play, stop } = useAntMedia()
  const [started, setStarted] = useState(false)
  // Start muted — browsers block unmuted programmatic autoplay
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isConnected && !started) {
      play(streamId)
      setStarted(true)
    }
    return () => { if (started) stop(streamId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  // React's muted prop on <video> is broken — set it via DOM directly
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const handleUnmute = () => {
    setMuted(false)
    videoRef.current?.play().catch(() => {})
  }

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-white/[0.07]">
      <video ref={videoRef} id="remoteVideo-p2p" autoPlay playsInline className="w-full h-full object-cover" />

      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-zinc-900/80">
          <Video className="h-6 w-6 text-zinc-700" />
          <span className="text-zinc-600 text-xs">Connecting…</span>
        </div>
      )}

      {/* Unmute overlay — browser blocks audio on programmatic autoplay */}
      {started && muted && (
        <button
          onClick={handleUnmute}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/40 transition-colors"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 border border-white/20">
            <VolumeX className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">Tap to hear viewer</span>
        </button>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white border border-white/[0.08]">
        <span className={`w-1.5 h-1.5 rounded-full ${started ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
        {displayName}
      </div>
    </div>
  )
}

// ── Incoming request card ─────────────────────────────────────────────────────
function RequestCard({
  request,
  onAccept,
  onReject,
}: {
  request: CallRequest
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-amber-500/20"
      style={{ background: 'rgba(245,158,11,0.06)' }}
    >
      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
        <span className="text-amber-400 text-xs font-bold">
          {request.viewer_name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{request.viewer_name}</p>
        <p className="text-zinc-500 text-xs">Private call request</p>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={onAccept}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-xs transition-all duration-200"
        >
          <UserCheck className="h-3 w-3" />
          Accept
        </button>
        <button
          onClick={onReject}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs border border-white/[0.07] transition-all duration-200"
        >
          <UserX className="h-3 w-3" />
          Decline
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface OneToOneCallProps {
  streamId: string
}

export default function OneToOneCall({ streamId }: OneToOneCallProps) {
  const { pending, activeCall, ready, accept, reject, endCall } = useStreamerSignaling(streamId)

  const hostStreamId   = `priv-${streamId}-host`
  const viewerStreamId = activeCall ? `priv-${streamId}-viewer-${activeCall.viewer_id}` : ''

  // ── Active call ───────────────────────────────────────────────────────────
  if (activeCall) {
    return (
      <div
        className="rounded-2xl border border-white/[0.06] overflow-hidden"
        style={{ background: 'var(--glass-bg)' }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div>
            <p className="text-white text-sm font-semibold">Private Call</p>
            <p className="text-xs flex items-center gap-1.5 text-zinc-500 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeCall.viewer_name}
            </p>
          </div>
          <button
            onClick={endCall}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all duration-200"
          >
            <PhoneOff className="h-3 w-3" />
            End
          </button>
        </div>

        {/* Stacked video tiles — viewer on top (bigger), streamer below (smaller) */}
        <div className="p-3 space-y-2">
          <AntMediaProvider role="player" remoteVideoId="remoteVideo-p2p">
            <ViewerRemoteTile streamId={viewerStreamId} displayName={activeCall.viewer_name} />
          </AntMediaProvider>
          <AntMediaProvider role="publisher" localVideoId="localVideo-p2p">
            <StreamerLocalTile streamId={hostStreamId} />
          </AntMediaProvider>
        </div>
      </div>
    )
  }

  // ── Waiting room panel ────────────────────────────────────────────────────
  return (
    <div
      className="rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: 'var(--glass-bg)' }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <p className="text-white text-sm font-semibold">Private Calls</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-zinc-500 text-xs">{ready ? 'Listening' : 'Connecting…'}</span>
        </div>
      </div>

      {/* Request list or empty state */}
      <div className="p-3">
        {pending.length > 0 ? (
          <div className="space-y-2">
            {pending.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                onAccept={() => accept(req)}
                onReject={() => reject(req.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <Clock className="h-5 w-5 text-zinc-600" />
            </div>
            <div className="space-y-1">
              <p className="text-zinc-400 text-xs font-medium">No requests yet</p>
              <p className="text-zinc-600 text-xs max-w-[180px]">
                Viewers watching your stream can request a private call here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
