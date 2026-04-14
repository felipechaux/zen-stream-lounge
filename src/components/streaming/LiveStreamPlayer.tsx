'use client'

import React, { useEffect, useRef, useState } from 'react';

interface LiveStreamPlayerProps {
  streamId: string;
}

/** Routes HLS through the Next.js proxy so port 5443 is never hit directly by the client */
function getHlsUrl(streamId: string): string {
  return `/api/streams/hls/${streamId}.m3u8`;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({ streamId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<'hls' | 'webrtc'>('hls');

  // ── HLS player ──────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'hls') return;
    let destroyed = false;

    const initHls = async () => {
      // hls.js AutoPIP tries to register 'enterpictureinpicture' which is only
      // supported in Chrome 120+. Patch MediaSession to silently swallow it.
      if (typeof navigator !== 'undefined' && navigator.mediaSession) {
        const orig = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession)
        navigator.mediaSession.setActionHandler = (action, handler) => {
          try { orig(action, handler) } catch (_) {}
        }
      }

      const Hls = (await import('hls.js')).default;
      const video = videoRef.current;
      if (!video || destroyed) return;

      const hlsUrl = getHlsUrl(streamId);

      // Safari / iOS — native HLS support
      if (!Hls.isSupported() && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.play().catch(() => {});
        setStatus('playing');
        return;
      }

      if (!Hls.isSupported()) {
        setErrorMsg('Your browser does not support HLS playback.');
        setStatus('error');
        return;
      }

      const hls = new Hls({
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        enableWorker: true,
      });
      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!destroyed) {
          video.play().catch(() => {});
          setStatus('playing');
        }
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (destroyed) return;
        if (data.fatal) {
          const is404 = data.response?.code === 404
          if (is404) {
            setErrorMsg('This stream is not live yet. Start the broadcast first.')
          } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setErrorMsg(`Network error loading stream (${data.details}). Check your connection.`)
          } else {
            setErrorMsg(`Playback error: ${data.details}`)
          }
          setStatus('error');
        }
      });
    };

    initHls();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamId, mode]);

  // ── WebRTC player (fallback) ─────────────────────────────
  const webrtcAdaptorRef = useRef<any>(null);

  useEffect(() => {
    if (mode !== 'webrtc') return;
    let destroyed = false;

    const initWebRTC = async () => {
      try {
        const [{ WebRTCAdaptor }, iceRes] = await Promise.all([
          import('@antmedia/webrtc_adaptor'),
          fetch('/api/ice-servers').then(r => r.json()).catch(() => ({ iceServers: [] })),
        ]);

        const url = process.env.NEXT_PUBLIC_ANT_MEDIA_URL;
        if (!url || destroyed) return;

        const adaptor = new WebRTCAdaptor({
          websocket_url: url,
          isPlayMode: true,
          mediaConstraints: { video: false, audio: false },
          peerconnection_config: { iceServers: iceRes.iceServers },
          sdp_constraints: { OfferToReceiveAudio: true, OfferToReceiveVideo: true },
          remoteVideoId: 'remoteVideo-player',
          callback: (info: string) => {
            if (destroyed) return;
            if (info === 'initialized') {
              adaptor.play(streamId);
              setStatus('playing');
            }
          },
          callbackError: (err: string) => {
            if (destroyed) return;
            if (err === 'no_stream_exist') {
              setErrorMsg('Stream not found or offline.');
            } else {
              setErrorMsg(`WebRTC error: ${err}`);
            }
            setStatus('error');
          },
        });
        webrtcAdaptorRef.current = adaptor;
      } catch {
        if (!destroyed) {
          setErrorMsg('Failed to load WebRTC player.');
          setStatus('error');
        }
      }
    };

    setStatus('loading');
    initWebRTC();

    return () => {
      destroyed = true;
      try {
        webrtcAdaptorRef.current?.stop(streamId);
        webrtcAdaptorRef.current?.closeWebSocket?.();
      } catch (_) {}
      webrtcAdaptorRef.current = null;
    };
  }, [streamId, mode]);

  const handleRetry = () => {
    setStatus('loading');
    setErrorMsg('');
    // Toggle between modes on retry so the user can try the other method
    setMode(m => m === 'hls' ? 'webrtc' : 'hls');
  };

  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 backdrop-blur-sm">
          <div className="animate-spin text-amber-500 mb-3">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-zinc-300 text-sm font-medium">
            {mode === 'hls' ? 'Loading stream…' : 'Connecting via WebRTC…'}
          </p>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-zinc-900/95 p-6 text-center gap-4">
          <div className="bg-red-900/20 p-4 rounded-full">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-red-400 font-bold text-lg mb-1">Stream Unavailable</p>
            <p className="text-zinc-400 text-sm max-w-sm">{errorMsg}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all"
            >
              Try {mode === 'hls' ? 'WebRTC' : 'HLS'}
            </button>
            <button
              onClick={() => { setStatus('loading'); setErrorMsg(''); setMode(m => m); }}
              className="px-5 py-2 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm transition-all"
            >
              Retry
            </button>
          </div>
          <p className="text-zinc-600 text-xs">
            Current method: {mode.toUpperCase()} — try the other if this keeps failing
          </p>
        </div>
      )}

      {/* Video element — used by both HLS and WebRTC */}
      <video
        id="remoteVideo-player"
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
        controls
        muted={false}
      />
    </div>
  );
};

export default LiveStreamPlayer;
