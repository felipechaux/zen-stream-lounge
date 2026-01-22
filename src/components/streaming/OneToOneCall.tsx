'use client';

import React, { useEffect, useRef, useState } from 'react';
import AntMediaProvider, { useAntMedia } from './AntMediaProvider';

interface OneToOneCallProps {
    streamId: string; // The ID for this user's stream
    peerStreamId: string; // The ID for the peer's stream
}

// Sub-component for the Publisher (Local Camera) side
const PublisherSection = ({
    streamId,
    setStreamId,
    isPublishing,
    setIsPublishing
}: {
    streamId: string,
    setStreamId: (id: string) => void,
    isPublishing: boolean,
    setIsPublishing: (v: boolean) => void
}) => {
    const { webRTCAdaptor, isConnected, publish, stop, error: antError } = useAntMedia();
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Effect to attach local stream to video element when ready
    useEffect(() => {
        // For local stream, we usually need to wait for 'initialized' or just attach user media directly if handled outside
        // But AntMedia SDK's publish often handles the getUserMedia. 
        // We'll rely on the adaptor to handle the stream, or simpler: 
        // The SDK usually attaches the local stream to the element with `localVideoId` automatically upon opening the camera.
        // We just need to make sure the ID matches.
    }, [webRTCAdaptor]);

    return (
        <div className="flex-1 min-w-[300px]">
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <label className="block text-sm text-gray-400 mb-2">My Stream ID</label>
                <input
                    type="text"
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    disabled={isPublishing}
                />
                <p className="text-xs text-gray-500 mt-1">Share this IDs with your peer</p>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 relative mb-4">
                <video
                    id="localVideo" // Must match localVideoId in AntMediaProvider config
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
                {!isPublishing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-gray-400">
                        Camera Offline
                    </div>
                )}
                {/* Overlay Status */}
                <h3 className="absolute top-2 left-2 bg-black/50 px-2 rounded z-10 text-sm">
                    You {isConnected ? '(Ready)' : '(Connecting...)'}
                </h3>
            </div>

            {!isPublishing ? (
                <button
                    onClick={() => {
                        publish(streamId);
                        setIsPublishing(true);
                    }}
                    disabled={!isConnected}
                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50 w-full"
                >
                    Start Camera
                </button>
            ) : (
                <button
                    onClick={() => {
                        stop(streamId);
                        setIsPublishing(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold w-full"
                >
                    Stop Camera
                </button>
            )}
            {antError && <div className="text-red-400 text-xs mt-2">{antError}</div>}
        </div>
    );
};

// Sub-component for the Player (Remote Peer) side
const PlayerSection = ({
    streamId,
    setStreamId,
    isPlaying,
    setIsPlaying
}: {
    streamId: string,
    setStreamId: (id: string) => void,
    isPlaying: boolean,
    setIsPlaying: (v: boolean) => void
}) => {
    const { webRTCAdaptor, isConnected, play, stop, error: antError } = useAntMedia();
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    return (
        <div className="flex-1 min-w-[300px]">
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <label className="block text-sm text-gray-400 mb-2">Peer Stream ID</label>
                <input
                    type="text"
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    disabled={isPlaying}
                />
                <p className="text-xs text-gray-500 mt-1">Enter peer&apos;s ID to connect</p>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 relative mb-4">
                {/* Note: The ID here is critical for the SDK to attach the remote stream */}
                <video
                    id="remoteVideo"
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-gray-400">
                        Peer Offline
                    </div>
                )}
                <h3 className="absolute top-2 left-2 bg-black/50 px-2 rounded z-10 text-sm">
                    Peer {isConnected ? '(Ready)' : '(Connecting...)'}
                </h3>
            </div>

            {!isPlaying ? (
                <button
                    onClick={() => {
                        play(streamId);
                        setIsPlaying(true);
                    }}
                    disabled={!isConnected}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50 w-full"
                >
                    Connect to Peer
                </button>
            ) : (
                <button
                    onClick={() => {
                        stop(streamId);
                        setIsPlaying(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold w-full"
                >
                    Disconnect Peer
                </button>
            )}
            {antError && <div className="text-red-400 text-xs mt-2">{antError}</div>}
        </div>
    );
};


export default function OneToOneCall({ streamId, peerStreamId }: OneToOneCallProps) {
    // Shared state management is done here, but execution is delegated to isolated providers
    const [localStreamId, setLocalStreamId] = useState(streamId || '');
    const [remoteStreamId, setRemoteStreamId] = useState(peerStreamId || 'user-2');

    // Track status for main UI feedback (optional, or could be pushed down)
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!streamId && !localStreamId) {
            setLocalStreamId(`user-${Math.floor(Math.random() * 10000)}`);
        }
    }, [streamId, localStreamId]);

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-900 text-white max-w-5xl mx-auto">
            <h2 className="text-xl font-bold mb-4">1-to-1 Video Call (Dual Channel)</h2>
            <p className="text-sm text-gray-400 mb-6">
                Establishing two separate secure connections for optimal stability.
            </p>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Side: Publisher (My Camera) */}
                <AntMediaProvider role="publisher">
                    <PublisherSection
                        streamId={localStreamId}
                        setStreamId={setLocalStreamId}
                        isPublishing={isPublishing}
                        setIsPublishing={setIsPublishing}
                    />
                </AntMediaProvider>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px bg-gray-700 self-stretch"></div>

                {/* Right Side: Player (Peer's Camera) */}
                <AntMediaProvider role="player">
                    <PlayerSection
                        streamId={remoteStreamId}
                        setStreamId={setRemoteStreamId}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                    />
                </AntMediaProvider>
            </div>
        </div>
    );
}
