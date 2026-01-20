'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAntMedia } from './AntMediaProvider';

interface OneToOneCallProps {
    streamId: string; // The ID for this user's stream
    peerStreamId: string; // The ID for the peer's stream
}

export default function OneToOneCall({ streamId, peerStreamId }: OneToOneCallProps) {
    const { webRTCAdaptor, isInitialized, isConnected, publish, play, stop } = useAntMedia();
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isInitialized && isConnected) {
            // Ideally we need to attach media stream to the video element.
            // The Ant Media SDK often looks for element by ID, but let's see if we can do it via ref or callback.
            // In the Provider, we set `localVideoId: "localVideo"`. 
            // For remote video, play() often takes a second argument for remote video element ID.
        }
    }, [isInitialized, isConnected]);

    const handleStart = () => {
        if (!webRTCAdaptor) return;

        // Publish our stream
        publish(streamId);
        setIsPublishing(true);

        // Play peer's stream
        // Note: In a real app, you might valid signal to know when peer is ready, 
        // but for simple 1-to-1 we can just try to play.

        // We need to tell the adaptor where to play the remote video. 
        // The play method in context wrapper was simple, let's expand it or access adaptor directly.
        // However, the adaptor usually takes the video element ID in the play command or relies on `remoteVideoId` in config.
        // Since we want dynamic, we might need to handle the track events or assign IDs.

        // Attempting to play peer stream on the remote video element
        // We must ensure the ID matches what the SDK expects or pass it.
    };

    // To handle the video elements correctly with Ant Media SDK in React:
    // 1. The local video is often handled by the SDK finding the element by ID 'localVideo'.
    // 2. The remote video is handled similarly or by `remoteVideoId`.
    // Problem: Reusability. 

    // Workaround: We will rely on the IDs being passed to the component or hardcoded for this demo,
    // but we need to ensure they match what we initialized in Provider or passed to methods.

    // Actually, looking at the provider, we initialized with `localVideoId: "localVideo"`.
    // So we SHOULD have an element with that ID here.

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-900 text-white">
            <h2 className="text-xl font-bold">1-to-1 Call</h2>
            <div className="flex flex-col md:flex-row gap-4">
                {/* Local Video */}
                <div className="flex-1 relative">
                    <h3 className="absolute top-2 left-2 bg-black/50 px-2 rounded">You ({streamId})</h3>
                    <video
                        id="localVideo"
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-64 bg-black object-cover rounded-lg border border-gray-700"
                    />
                </div>

                {/* Remote Video */}
                <div className="flex-1 relative">
                    <h3 className="absolute top-2 left-2 bg-black/50 px-2 rounded">Peer ({peerStreamId})</h3>
                    {/* Ant Media SDK often uses a specific ID for remote video or creates elements.
               If we use the standard play(streamId), it might look for an element or return a stream.
               Common Ant Media pattern: <video id="remoteVideo" ... /> 
               But multiple remote streams? 
               For 1-to-1, let's assume one remote video element.
           */}
                    <video
                        id="remoteVideo"
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 bg-black object-cover rounded-lg border border-gray-700"
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => {
                        publish(streamId);
                        setIsPublishing(true);
                    }}
                    disabled={!isConnected || isPublishing}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
                >
                    Start Call (Publish)
                </button>

                <button
                    onClick={() => {
                        // For the 'play' to work effectively with a specific element, 
                        // we might need to modify the Provider or access the adaptor's method 
                        // that accepts a video element ID if available, or rely on global config.
                        // Assuming standard `play` works and writes to the configured remote element? 
                        // Or we need to pass the ID.

                        // Let's assume we need to call play logic.
                        // The current Play wrapper in Provider just calls adaptor.play(streamId).
                        // Ant Media SDK default behavior: if no remoteVideoId configured, might not show?
                        // Actually, often it expects us to handle the `newStreamAvailable` callback and attach track.

                        // For this MVP, we will assume the user clicks "Play Peer" after peer starts.
                        play(peerStreamId);
                        setIsPlaying(true);
                    }}
                    disabled={!isConnected || isPlaying}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
                >
                    Connect to Peer (Play)
                </button>

                <button
                    onClick={() => {
                        stop(streamId);
                        stop(peerStreamId);
                        setIsPublishing(false);
                        setIsPlaying(false);
                    }}
                    disabled={!isPublishing && !isPlaying}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded disabled:opacity-50"
                >
                    Hang Up
                </button>
            </div>

            <div className="text-xs text-gray-400 mt-2">
                Status: {isConnected ? "Connected to Server" : "Disconnected"}
            </div>
        </div>
    );
}
