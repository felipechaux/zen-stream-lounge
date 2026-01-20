'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface AntMediaContextType {
  webRTCAdaptor: any; // Using any for now as types might be tricky with the adaptor
  isInitialized: boolean;
  isConnected: boolean;
  error: string | null;
  publish: (streamId: string) => void;
  play: (streamId: string) => void;
  stop: (streamId: string) => void;
  messages: string[];
}

const AntMediaContext = createContext<AntMediaContextType | null>(null);

export function useAntMedia() {
  const context = useContext(AntMediaContext);
  if (!context) {
    throw new Error('useAntMedia must be used within an AntMediaProvider');
  }
  return context;
}

interface AntMediaProviderProps {
  children: React.ReactNode;
  websocketUrl?: string; // Optional override
  role?: 'publisher' | 'player' | 'p2p'; // Default is 'publisher'
}

export default function AntMediaProvider({
  children,
  websocketUrl,
  role = 'publisher'
}: AntMediaProviderProps) {
  const [webRTCAdaptor, setWebRTCAdaptor] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // We use a local ref to track the adaptor instance for cleanup ensuring we can close it
  // regardless of the async state update.
  const adaptorInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Determine the URL
    const url = websocketUrl || process.env.NEXT_PUBLIC_ANT_MEDIA_URL;

    if (!url) {
      console.error('Ant Media WebSocket URL not found. Please set NEXT_PUBLIC_ANT_MEDIA_URL.');
      return;
    }

    const initAdaptor = async () => {
      try {
        // Dynamically import WebRTCAdaptor to avoid SSR issues
        // @antmedia/webrtc_adaptor is not SSR friendly
        const { WebRTCAdaptor } = await import('@antmedia/webrtc_adaptor');

        // Configure constraints based on role
        let mediaConstraints;
        let sdpConstraints;

        if (role === 'player') {
          // PLAYER: Does not send media, only receives
          mediaConstraints = {
            video: false,
            audio: false,
          };
          sdpConstraints = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true,
          };
        } else if (role === 'p2p') {
          // P2P: Sends and Receives
          mediaConstraints = {
            video: true,
            audio: true,
          };
          sdpConstraints = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true,
          };
        } else {
          // PUBLISHER (Default): Sends media, mostly doesn't need to receive (unless using return feed, but for broadcast usually OFF)
          mediaConstraints = {
            video: true,
            audio: true,
          };
          sdpConstraints = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false,
          };
        }

        const adaptor = new WebRTCAdaptor({
          websocket_url: url,
          mediaConstraints: mediaConstraints,
          peerconnection_config: {
            'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }]
          },
          sdp_constraints: sdpConstraints,
          localVideoId: "localVideo", // These IDs need to be present in the DOM where used, or handled dynamically
          isShow: false, // Don't show by default, let components handle visibility
          debug: true,
          callback: (info: string, obj: any) => {
            setMessages(prev => [...prev, `Callback: ${info}`]);
            if (info === "initialized") {
              setIsInitialized(true);
              setIsConnected(true);
              setError(null); // Clear errors on fresh init/reconnect
            } else if (info === "newStreamAvailable") {
              const videoElement = document.getElementById("remoteVideo") as HTMLVideoElement;
              console.log("newStreamAvailable event fired. Obj received:", obj);

              let streamToAttach = obj;

              // Handle potential wrapper object commonly found in some versions
              if (obj && !(obj instanceof MediaStream)) {
                if (obj.stream instanceof MediaStream) {
                  console.log("Found nested stream in obj.stream");
                  streamToAttach = obj.stream;
                } else if (obj.mediaStream instanceof MediaStream) {
                  console.log("Found nested stream in obj.mediaStream");
                  streamToAttach = obj.mediaStream;
                }
              }

              if (videoElement) {
                try {
                  videoElement.srcObject = streamToAttach;
                  // Attempt to play just in case autoPlay didn't pick it up immediately
                  videoElement.play().catch(e => console.warn("Auto-play failed", e));
                  setError(null); // Success
                } catch (e) {
                  console.error("Failed to set srcObject:", e);
                }
              }
            } else if (info === "closed") {
              setIsConnected(false);
              setIsInitialized(false);
            } else if (info === "play_finished") {
              // Stream ended remotely
              console.log("Stream finished");
            }
          },
          callbackError: (errorKey: string, message: string) => {
            if (errorKey === "no_stream_exist") {
              // Log as warning to avoid console error spam in 1-to-1/P2P calls where this is expected initially
              console.warn("Ant Media Info:", errorKey, "Stream not yet ready");
              setMessages(prev => [...prev, `Info: Waiting for stream...`]);

              if (role === 'p2p') {
                setError("Waiting for peer to join...");
              } else {
                setError("Stream is offline or does not exist.");
              }
            } else {
              setMessages(prev => [...prev, `Error: ${errorKey} - ${message}`]);
              console.error("Ant Media Error:", errorKey, message);

              if (errorKey === "streamIdInUse") {
                setError("Stream ID is already active. Please try another ID.");
              } else {
                setError(`Error: ${message || errorKey}`);
              }
            }
          }
        });

        adaptorInstanceRef.current = adaptor;
        setWebRTCAdaptor(adaptor);
      } catch (e) {
        console.error("Failed to initialize WebRTCAdaptor", e);
      }
    };

    initAdaptor();

    return () => {
      if (adaptorInstanceRef.current) {
        // Use internal method to close if available or stop
        // The SDK typically has .closeWebSocket()
        try {
          if (adaptorInstanceRef.current.closeWebSocket) {
            adaptorInstanceRef.current.closeWebSocket();
          } else if (adaptorInstanceRef.current.close) {
            adaptorInstanceRef.current.close();
          }
        } catch (err) {
          console.warn("Error closing adaptor", err);
        }
        adaptorInstanceRef.current = null;
      }
    };
  }, [websocketUrl, role]);

  const publish = useCallback((streamId: string) => {
    if (webRTCAdaptor && isInitialized) {
      webRTCAdaptor.publish(streamId, "");
    } else {
      console.warn("WebRTCAdaptor not ready to publish");
    }
  }, [webRTCAdaptor, isInitialized]);

  const play = useCallback((streamId: string) => {
    if (webRTCAdaptor && isInitialized) {
      webRTCAdaptor.play(streamId, "");
    } else {
      console.warn("WebRTCAdaptor not ready to play");
    }
  }, [webRTCAdaptor, isInitialized]);

  const stop = useCallback((streamId: string) => {
    if (webRTCAdaptor && isInitialized) {
      webRTCAdaptor.stop(streamId);
    }
  }, [webRTCAdaptor, isInitialized]);

  const value = {
    webRTCAdaptor,
    isInitialized,
    isConnected,
    error,
    publish,
    play,
    stop,
    messages
  };

  return (
    <AntMediaContext.Provider value={value}>
      {children}
    </AntMediaContext.Provider>
  );
}
