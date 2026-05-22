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
  websocketUrl?: string;
  role?: 'publisher' | 'player' | 'p2p';
  localVideoId?: string;  // DOM element ID for local camera preview (default: 'localVideo')
  remoteVideoId?: string; // DOM element ID for remote stream (default: 'remoteVideo')
  // Fired when the remote peer disappears (play_finished from server, or ICE
  // state goes to failed/closed/long-disconnected). UI layer should react by
  // ending the call so the row in the DB is closed for the other side too.
  onPeerDisconnect?: (streamId: string) => void;
}

export default function AntMediaProvider({
  children,
  websocketUrl,
  role = 'publisher',
  localVideoId = 'localVideo',
  remoteVideoId = 'remoteVideo',
  onPeerDisconnect,
}: AntMediaProviderProps) {
  const [webRTCAdaptor, setWebRTCAdaptor] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // We use a local ref to track the adaptor instance for cleanup ensuring we can close it
  // regardless of the async state update.
  const adaptorInstanceRef = useRef<any>(null);
  // Tracks streams being played so we can retry on no_stream_exist
  const playRetryRef = useRef<Map<string, { attempt: number; timer: ReturnType<typeof setTimeout> | null }>>(new Map());
  // Latest peer-disconnect handler (refed so the effect doesn't re-init on change)
  const onPeerDisconnectRef = useRef<((streamId: string) => void) | undefined>(onPeerDisconnect);
  useEffect(() => { onPeerDisconnectRef.current = onPeerDisconnect }, [onPeerDisconnect]);
  // Per-stream disconnect bookkeeping: debounce 'disconnected' state and ensure
  // we fire onPeerDisconnect at most once per stream.
  const disconnectStateRef = useRef<Map<string, { timer: ReturnType<typeof setTimeout> | null; fired: boolean }>>(new Map());

  const firePeerDisconnect = useCallback((streamId: string) => {
    if (!streamId) return;
    const entry = disconnectStateRef.current.get(streamId) ?? { timer: null, fired: false };
    if (entry.fired) return;
    entry.fired = true;
    if (entry.timer) { clearTimeout(entry.timer); entry.timer = null; }
    disconnectStateRef.current.set(streamId, entry);
    try { onPeerDisconnectRef.current?.(streamId); } catch (e) { console.warn('[AntMedia] onPeerDisconnect threw', e); }
  }, []);

  useEffect(() => {
    // Determine the URL
    const url = websocketUrl || process.env.NEXT_PUBLIC_ANT_MEDIA_URL;

    if (!url) {
      console.error('Ant Media WebSocket URL not found. Please set NEXT_PUBLIC_ANT_MEDIA_URL.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('WebRTC requires HTTPS. Please access this page over HTTPS or via localhost.');
      console.error('[AntMedia] Page is not in a secure context (requires HTTPS or localhost). WebRTC will not work.');
      return;
    }

    const initAdaptor = async () => {
      try {
        const iceServersRes = await fetch('/api/ice-servers').then(r => r.json()).catch(() => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }));
        const iceServers = iceServersRes.iceServers;

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
          // Use standard publisher constraints for P2P via SFU to avoid m-line conflicts
          sdpConstraints = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false,
          };
        } else {
          // PUBLISHER (Default): Sends media
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
          peerconnection_config: { iceServers },
          sdp_constraints: sdpConstraints,
          localVideoId,
          isShow: false, // Don't show by default, let components handle visibility
          debug: true,
          callback: (info: string, obj: any) => {
            setMessages(prev => [...prev, `Callback: ${info}`]);
            if (info === "initialized") {
              setIsInitialized(true);
              setIsConnected(true);
              setError(null); // Clear errors on fresh init/reconnect
            } else if (info === "play_started") {
              // Stream is playing — cancel any pending retries for it
              const streamId: string = obj?.streamId ?? obj ?? ''
              const entry = playRetryRef.current.get(streamId)
              if (entry?.timer) clearTimeout(entry.timer)
              playRetryRef.current.delete(streamId)
            } else if (info === "newStreamAvailable") {
              const videoElement = document.getElementById(remoteVideoId) as HTMLVideoElement;
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
                  // Preserve the user's muted preference (they may have unmuted before
                  // the stream arrived). Force mute only to satisfy autoplay policy,
                  // then restore the original state after play() resolves.
                  const prevMuted = videoElement.muted;
                  videoElement.muted = true;
                  videoElement.srcObject = streamToAttach;
                  videoElement.play()
                    .then(() => { videoElement.muted = prevMuted; })
                    .catch(e => { console.warn("Auto-play failed", e); videoElement.muted = prevMuted; });
                  setError(null); // Success
                } catch (e) {
                  console.error("Failed to set srcObject:", e);
                }
              }
            } else if (info === "closed") {
              setIsConnected(false);
              setIsInitialized(false);
            } else if (info === "play_finished") {
              // Server told us the remote publisher stopped — peer is gone.
              const sid: string = obj?.streamId ?? obj ?? ''
              console.log("Stream finished", sid);
              firePeerDisconnect(sid);
            } else if (info === "ice_connection_state_changed") {
              const sid: string = obj?.streamId ?? ''
              const state: string = obj?.state ?? ''
              if (!sid) return;
              const entry = disconnectStateRef.current.get(sid) ?? { timer: null, fired: false };
              if (state === 'failed' || state === 'closed') {
                firePeerDisconnect(sid);
              } else if (state === 'disconnected') {
                // Transient — give the adaptor a chance to reconnect, then give up.
                if (entry.timer) clearTimeout(entry.timer);
                entry.timer = setTimeout(() => firePeerDisconnect(sid), 6000);
                disconnectStateRef.current.set(sid, entry);
              } else if (state === 'connected' || state === 'completed') {
                // Recovered — cancel any pending disconnect timer.
                if (entry.timer) { clearTimeout(entry.timer); entry.timer = null; }
                disconnectStateRef.current.set(sid, entry);
              }
            }
          },
          callbackError: (errorKey: string, message: string) => {
            if (errorKey === "no_stream_exist") {
              // AntMedia passes the stream ID as `message` for this error.
              // Automatically retry play() so publish/play timing races resolve themselves.
              const streamId: string = message ?? ''
              const entry = playRetryRef.current.get(streamId)

              if (entry !== undefined) {
                const MAX_RETRIES = 15
                if (entry.attempt < MAX_RETRIES) {
                  const delay = Math.min(2000 + entry.attempt * 1000, 8000)
                  console.warn(`[AntMedia] no_stream_exist for "${streamId}" — retry ${entry.attempt + 1}/${MAX_RETRIES} in ${delay}ms`)
                  if (entry.timer) clearTimeout(entry.timer)
                  entry.timer = setTimeout(() => {
                    if (playRetryRef.current.has(streamId) && adaptorInstanceRef.current) {
                      entry.attempt++
                      adaptorInstanceRef.current.play(streamId, '')
                    }
                  }, delay)
                } else {
                  console.warn(`[AntMedia] Stream "${streamId}" unavailable after ${MAX_RETRIES} retries`)
                  playRetryRef.current.delete(streamId)
                  setError("Stream is offline or does not exist.")
                }
              } else {
                console.warn(`[AntMedia] no_stream_exist for untracked stream "${streamId}"`)
              }
            } else if (errorKey === "WebSocketNotConnected") {
              setMessages(prev => [...prev, `Error: Connection lost. Please refresh or try again.`]);
              setIsConnected(false);
              setIsInitialized(false);
              setError("Connection lost. Please refresh the page.");
            } else if (errorKey === "notSetRemoteDescription") {
              setMessages(prev => [...prev, `Error: Negotiation failed. Retrying might help.`]);
              console.warn("Ant Media Warning: Remote description not set. Synchronization issue.");
              setError("Connection failed temporarily. Please try pressing Connect again.");
            } else if (errorKey === "noStreamNameSpecified") {
              // Benign: server received a command without a stream ID.
              // This happens when the adaptor is idle (no publish/play called yet)
              // or when an empty string was passed — safe to ignore as a warning.
              console.warn("Ant Media: no stream name specified (adaptor idle or empty stream ID)");
            } else if (errorKey === "UnsecureContext") {
              const msg = 'WebRTC requires HTTPS. Please access this page over HTTPS or via localhost.';
              console.error('[AntMedia] UnsecureContext — page must be served over HTTPS or localhost for WebRTC to work.');
              setError(msg);
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
      // Cancel all pending play retries
      playRetryRef.current.forEach(entry => { if (entry.timer) clearTimeout(entry.timer) })
      playRetryRef.current.clear()
      // Cancel any pending disconnect debounce timers
      disconnectStateRef.current.forEach(entry => { if (entry.timer) clearTimeout(entry.timer) })
      disconnectStateRef.current.clear()

      if (adaptorInstanceRef.current) {
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
    if (!streamId) {
      console.warn("WebRTCAdaptor: publish() called with empty stream ID — skipped");
      return;
    }
    if (webRTCAdaptor && isInitialized) {
      webRTCAdaptor.publish(streamId, "");
    } else {
      console.warn("WebRTCAdaptor not ready to publish");
    }
  }, [webRTCAdaptor, isInitialized]);

  const play = useCallback((streamId: string) => {
    if (!streamId) {
      console.warn("WebRTCAdaptor: play() called with empty stream ID — skipped");
      return;
    }
    if (webRTCAdaptor && isInitialized) {
      // Register for auto-retry on no_stream_exist
      playRetryRef.current.set(streamId, { attempt: 0, timer: null })
      // Reset any previous disconnect state for this stream ID
      const prev = disconnectStateRef.current.get(streamId)
      if (prev?.timer) clearTimeout(prev.timer)
      disconnectStateRef.current.set(streamId, { timer: null, fired: false })
      webRTCAdaptor.play(streamId, "");
    } else {
      console.warn("WebRTCAdaptor not ready to play");
    }
  }, [webRTCAdaptor, isInitialized]);

  const stop = useCallback((streamId: string) => {
    // Cancel any pending retry / disconnect timer for this stream
    const retry = playRetryRef.current.get(streamId)
    if (retry?.timer) clearTimeout(retry.timer)
    playRetryRef.current.delete(streamId)
    const disc = disconnectStateRef.current.get(streamId)
    if (disc?.timer) clearTimeout(disc.timer)
    disconnectStateRef.current.delete(streamId)

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
