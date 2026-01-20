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
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {!websocketConnected && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Connecting...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center flex-col text-white bg-black/80 z-10 p-4 text-center">
          <p className="text-red-500 font-bold mb-2">Error</p>
          <p>{error}</p>
        </div>
      )}

      <video
        id="remoteVideo-player" // Matches the config
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        controls
      />
    </div>
  );
};

export default LiveStreamPlayer;
