import React, { useEffect, useRef, useState, useCallback } from 'react';

interface LiveStreamPlayerProps {
  streamId: string;
  autoPlay?: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2500;

async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch('/api/ice-servers');
    if (res.ok) {
      const data = await res.json();
      return data.iceServers;
    }
  } catch (_) {}
  // Fallback if API unreachable
  return [{ urls: 'stun:stun.l.google.com:19302' }];
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({ streamId, autoPlay = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const webRTCAdaptor = useRef<any>(null);
  const playingStreamId = useRef<string | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const destroyAdaptor = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    if (webRTCAdaptor.current) {
      try {
        if (playingStreamId.current) webRTCAdaptor.current.stop(playingStreamId.current);
        if (webRTCAdaptor.current.closeWebSocket) webRTCAdaptor.current.closeWebSocket();
        else if (webRTCAdaptor.current.close) webRTCAdaptor.current.close();
      } catch (_) {}
      webRTCAdaptor.current = null;
    }
    playingStreamId.current = null;
  }, []);

  const scheduleRetry = useCallback((currentRetry: number) => {
    if (currentRetry >= MAX_RETRIES) {
      setError('Connection failed after several attempts. Please refresh the page.');
      setIsRetrying(false);
      return;
    }
    setIsRetrying(true);
    setError(null);
    retryTimer.current = setTimeout(() => {
      setRetryCount(currentRetry + 1);
    }, RETRY_DELAY_MS);
  }, []);

  useEffect(() => {
    let adaptor: any = null;
    setWebsocketConnected(false);
    setIsPlaying(false);
    setError(null);

    const initAdaptor = async () => {
      try {
        const [{ WebRTCAdaptor }, iceServers] = await Promise.all([
          import('@antmedia/webrtc_adaptor'),
          fetchIceServers(),
        ]);
        const url = process.env.NEXT_PUBLIC_ANT_MEDIA_URL;

        if (!url) {
          setError('Ant Media URL not configured');
          return;
        }

        adaptor = new WebRTCAdaptor({
          websocket_url: url,
          isPlayMode: true,
          mediaConstraints: { video: false, audio: false },
          peerconnection_config: { iceServers },
          sdp_constraints: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true,
          },
          remoteVideoId: 'remoteVideo-player',
          callback: (info: string, obj: any) => {
            console.log('WebRTC info:', info, obj);
            if (info === 'initialized') {
              setWebsocketConnected(true);
              setIsRetrying(false);
              setError(null);
            } else if (info === 'play_finished') {
              setIsPlaying(false);
            }
          },
          callbackError: (err: string, message: any) => {
            console.error('WebRTC error:', err, message);
            if (err === 'no_stream_exist') {
              setIsPlaying(false);
              setError('Stream not found or offline');
            } else if (err === 'WebSocketNotConnected') {
              setIsPlaying(false);
              setWebsocketConnected(false);
              setRetryCount(c => {
                scheduleRetry(c);
                return c;
              });
            } else {
              setError(typeof err === 'string' ? err : JSON.stringify(err));
            }
          },
        });

        webRTCAdaptor.current = adaptor;
      } catch (e) {
        console.error('Failed to load WebRTCAdaptor', e);
        setError('Failed to load streaming library');
      }
    };

    initAdaptor();

    return () => { destroyAdaptor(); };
  }, [streamId, retryCount, destroyAdaptor, scheduleRetry]);

  // Auto-play once connected
  useEffect(() => {
    if (websocketConnected && autoPlay && webRTCAdaptor.current && !isPlaying) {
      playStream();
    }
  }, [websocketConnected, autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  const playStream = () => {
    if (webRTCAdaptor.current && websocketConnected) {
      setError(null);
      playingStreamId.current = streamId;
      webRTCAdaptor.current.play(streamId);
      setIsPlaying(true);
    }
  };

  const handleManualRetry = () => {
    destroyAdaptor();
    setRetryCount(0);
    setError(null);
    setIsRetrying(true);
    // Trigger re-init by bumping retryCount via setState with a small trick
    setTimeout(() => setRetryCount(1), 100);
  };

  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
      {/* Connecting state */}
      {!websocketConnected && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur-sm z-10">
          <div className="animate-spin text-amber-500 mb-4">
            <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-zinc-300 font-medium tracking-wide">
            {isRetrying ? `Reconnecting…` : 'Connecting to Stream…'}
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center flex-col text-white bg-zinc-900/90 z-20 p-6 text-center gap-4">
          <div className="bg-red-900/20 p-4 rounded-full">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-red-400 font-bold mb-1 text-lg">Stream Unavailable</p>
            <p className="text-zinc-400 text-sm max-w-md">{error}</p>
          </div>
          <button
            onClick={handleManualRetry}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      )}

      <video
        id="remoteVideo-player"
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
        controls
      />
    </div>
  );
};

export default LiveStreamPlayer;
