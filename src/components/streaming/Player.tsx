'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAntMedia } from './AntMediaProvider';

export default function Player() {
    const searchParams = useSearchParams();
    const { isConnected, play, stop, messages, error } = useAntMedia();
    const [streamId, setStreamId] = useState(searchParams.get('id') || '');
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = () => {
        play(streamId);
        setIsPlaying(true);
    };

    const handleStop = () => {
        stop(streamId);
        setIsPlaying(false);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg text-white max-w-2xl mx-auto my-8">
            <h2 className="text-2xl font-bold mb-4">Live Stream Player</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Watch Stream ID</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={streamId}
                        onChange={(e) => setStreamId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        suppressHydrationWarning
                    />
                    <button
                        onClick={isPlaying ? handleStop : handlePlay}
                        disabled={!isConnected}
                        className={`px-4 py-2 rounded font-semibold whitespace-nowrap ${isPlaying
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                            } disabled:opacity-50`}
                    >
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                </div>
                {error && (
                    <div className="mt-2 text-red-400 text-sm bg-red-900/20 border border-red-900 p-2 rounded">
                        {error}
                    </div>
                )}
            </div>

            <div className="relative bg-black h-96 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                {/* Remote Video */}
                {/* Ant Media plays remote stream into an element ID provided or 'remoteVideo' by default logic if coded that way.
            Since my Provider setup was generic, I need to ensure there is a target. 
            The `play` function in provider calls `webRTCAdaptor.play(streamId)`. 
            The adaptor usually creates or finds a video element. 
            Commonly, we can pass `remoteVideoId` in init, but for many streams, we need dynamic handling.
            For this simplified demo, we assume the adaptor will find "remoteVideo".
        */}
                <video
                    id="remoteVideo"
                    autoPlay
                    playsInline
                    controls
                    className="w-full h-full object-contain"
                />

                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-gray-400">
                        <p>Waiting to play...</p>
                    </div>
                )}
            </div>

            <div className="text-sm text-gray-400">
                Status: {isConnected ? 'Server Connected' : 'Disconnected'}
            </div>
        </div>
    );
}
