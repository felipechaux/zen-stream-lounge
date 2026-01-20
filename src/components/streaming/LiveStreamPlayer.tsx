import React, { useEffect, useRef, useState } from 'react';
// Remove static import to prevent SSR issues if this component is ever imported statically
// import { WebRTCAdaptor } from '@antmedia/webrtc_adaptor';

interface LiveStreamPlayerProps {
  streamId: string;
  autoPlay?: boolean;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({ streamId, autoPlay = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webRTCAdaptor = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playingStreamId = useRef<string | null>(null);

  useEffect(() => {
    let adaptor: any = null;

    const initAdaptor = async () => {
      try {
        const { WebRTCAdaptor } = await import('@antmedia/webrtc_adaptor');
        const url = process.env.NEXT_PUBLIC_ANT_MEDIA_URL;

        if (!url) {
          setError('Ant Media URL not configured');
          return;
        }

        adaptor = new WebRTCAdaptor({
          websocket_url: url,
          isPlayMode: true,
          mediaConstraints: {
            video: false,
            audio: false,
          },
          peerconnection_config: {
            iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }],
          },
          sdp_constraints: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true,
          },
          remoteVideoId: 'remoteVideo-player',
          callback: (info: string, obj: any) => {
            if (info === 'initialized') {
              setWebsocketConnected(true);
              // We can only autoplay here if we have reference to this specific instance closure
              // But since correct ref is attached to component, we can use playStream logic
              // However, let's wait for useEffect dependency update or just check ref
            }
            console.log('WebRTC info:', info, obj);
          },
          callbackError: function (error: any, message: any) {
            console.error('WebRTC error:', error, message);
            if (error === 'no_stream_exist') {
              setIsPlaying(false);
              setError('Stream not found or offline');
            } else {
              setError(typeof error === 'string' ? error : JSON.stringify(error));
            }
          },
        });
        webRTCAdaptor.current = adaptor;

        // Trigger autoplay check if needed (might need a slight delay or effect dependency)
        // But usually we wait for 'initialized' callback to trigger play.
        // The original code tried to call playStream in callback. Here we can't fully replicate because playStream needs webRTCAdaptor.current to be set.
        // Setting it above helps.
      } catch (e) {
        console.error("Failed to load WebRTCAdaptor", e);
        setError("Failed to load streaming library");
      }
    };

    initAdaptor();

    return () => {
      if (webRTCAdaptor.current) {
        if (playingStreamId.current) {
          webRTCAdaptor.current.stop(playingStreamId.current);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  // Effect to handle autoplay once connected and adaptor is ready
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

  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
      {!websocketConnected && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur-sm z-10">
          <div className="animate-spin text-amber-500 mb-4">
            <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-zinc-300 font-medium tracking-wide">Connecting to Stream...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center flex-col text-white bg-zinc-900/90 z-20 p-6 text-center">
          <div className="bg-red-900/20 p-4 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 font-bold mb-2 text-lg">Stream Unavailable</p>
          <p className="text-zinc-400 max-w-md">{error}</p>
        </div>
      )}

      <video
        id="remoteVideo-player" // Matches the config
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
        controls
      />
    </div>
  );
};

export default LiveStreamPlayer;
