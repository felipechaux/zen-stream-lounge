'use client';

import React, { useState } from 'react';
import { useAntMedia } from './AntMediaProvider';

export default function Broadcaster() {
    const { isConnected, publish, stop, messages } = useAntMedia();
    const [streamId, setStreamId] = useState(`stream-${Math.floor(Math.random() * 10000)}`);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleStartBroadcast = () => {
        publish(streamId);
        setIsPublishing(true);
    };

    const handleStopBroadcast = () => {
        stop(streamId);
        setIsPublishing(false);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg text-white max-w-2xl mx-auto my-8">
            <h2 className="text-2xl font-bold mb-4">Broadcaster Studio</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Stream ID</label>
                <input
                    type="text"
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    suppressHydrationWarning
                />
            </div>

            <div className="relative bg-black h-96 rounded-lg mb-4 overflow-hidden">
                {/* Local Preview Video */}
                <video
                    id="localVideo"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isPublishing ? 'bg-red-600' : 'bg-gray-600'}`}>
                        {isPublishing ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                    {isConnected ? 'Server Connected' : 'Disconnected'}
                </div>
                <div className="flex gap-4">
                    {!isPublishing ? (
                        <button
                            onClick={handleStartBroadcast}
                            disabled={!isConnected}
                            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                        >
                            Start Broadcast
                        </button>
                    ) : (
                        <div className="flex gap-4">

                            <button
                                onClick={handleStopBroadcast}
                                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold"
                            >
                                Stop Broadcast
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isPublishing && (
                <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-sm text-yellow-200">
                    <strong>Tip:</strong> Copy your Stream ID <code>{streamId}</code> to share or watch in another tab. Staying in this tab keeps the broadcast live!
                </div>
            )}

            {/* Debug Messages */}
            <div className="mt-4 p-2 bg-black/30 rounded text-xs h-32 overflow-y-auto font-mono text-gray-400">
                <div className="font-bold mb-1">Logs:</div>
                {messages.map((msg, idx) => (
                    <div key={idx}>{msg}</div>
                ))}
            </div>
        </div>
    );
}
