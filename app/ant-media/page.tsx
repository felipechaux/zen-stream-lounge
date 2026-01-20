'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AntMediaProvider from '@/components/streaming/AntMediaProvider';
import OneToOneCall from '@/components/streaming/OneToOneCall';
import Broadcaster from '@/components/streaming/Broadcaster';
import Player from '@/components/streaming/Player';

function AntMediaContent() {
    const searchParams = useSearchParams();
    // Initialize with a default value to ensure server and client match initially
    const [mode, setMode] = useState<'p2p' | 'broadcast' | 'play'>('broadcast');

    // Sync with URL params on client side only
    React.useEffect(() => {
        const modeParam = searchParams.get('mode');
        if (modeParam && ['p2p', 'broadcast', 'play'].includes(modeParam)) {
            setMode(modeParam as 'p2p' | 'broadcast' | 'play');
        }
    }, [searchParams]);

    // For P2P demo - use state to avoid mismatch as well, or just suppress if they are just display
    // But better to use effects if they drive logic or are displayed
    const [userId, setUserId] = useState('user1');
    const [peerId, setPeerId] = useState('user2');

    React.useEffect(() => {
        const idParam = searchParams.get('id');
        const peerParam = searchParams.get('peer');
        if (idParam) setUserId(idParam);
        if (peerParam) setPeerId(peerParam);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <header className="mb-8 border-b border-gray-800 pb-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                    Zen Stream x Ant Media
                </h1>
                <p className="text-gray-400 mt-2">
                    Demonstrating 1-to-1 Video Calls and 1-to-Many Live Broadcasting
                </p>
            </header>

            <div className="flex gap-4 mb-8 justify-center">
                <button
                    onClick={() => setMode('broadcast')}
                    className={`px-4 py-2 rounded-full border ${mode === 'broadcast' ? 'bg-white text-black border-white' : 'border-gray-600 hover:border-gray-400'}`}
                >
                    Start Broadcast
                </button>
                <button
                    onClick={() => setMode('play')}
                    className={`px-4 py-2 rounded-full border ${mode === 'play' ? 'bg-white text-black border-white' : 'border-gray-600 hover:border-gray-400'}`}
                >
                    Watch Stream
                </button>
                <button
                    onClick={() => setMode('p2p')}
                    className={`px-4 py-2 rounded-full border ${mode === 'p2p' ? 'bg-white text-black border-white' : 'border-gray-600 hover:border-gray-400'}`}
                >
                    1-to-1 Video Call
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {mode === 'broadcast' && (
                    <AntMediaProvider key="broadcast" role="publisher">
                        <Broadcaster />
                    </AntMediaProvider>
                )}

                {mode === 'play' && (
                    <AntMediaProvider key="play" role="player">
                        <Player />
                    </AntMediaProvider>
                )}

                {mode === 'p2p' && (
                    <AntMediaProvider key="p2p" role="p2p">
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-900 rounded-lg text-sm text-gray-400">
                                <p><strong>To test P2P:</strong> Open this page in two separate tabs.</p>
                                <ul className="list-disc ml-4 mt-2">
                                    <li>Tab 1: Use ID <code>user1</code> and Peer <code>user2</code></li>
                                    <li>Tab 2: Use ID <code>user2</code> and Peer <code>user1</code></li>
                                </ul>
                                <div className="mt-4 flex gap-4 items-center">
                                    <span>My ID: <strong>{userId}</strong></span>
                                    <span>Peer ID: <strong>{peerId}</strong></span>
                                </div>
                            </div>
                            <OneToOneCall streamId={userId} peerStreamId={peerId} />
                        </div>
                    </AntMediaProvider>
                )}
            </div>
        </div>
    );
}

export default function AntMediaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">Loading streaming interface...</div>}>
            <AntMediaContent />
        </Suspense>
    );
}
