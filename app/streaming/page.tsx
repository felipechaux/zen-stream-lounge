'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AntMediaProvider from '@/components/streaming/AntMediaProvider';
import OneToOneCall from '@/components/streaming/OneToOneCall';
import Broadcaster from '@/components/streaming/Broadcaster';
// Dynamically import LiveStreamPlayer to avoid SSR issues with WebRTC
import dynamic from 'next/dynamic';
const LiveStreamPlayer = dynamic(() => import('@/components/streaming/LiveStreamPlayer'), { ssr: false });

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
            <header className="mb-12 border-b border-zinc-800 pb-6">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                    ZenStream Lounge <span className="text-white text-2xl font-normal ml-2 opacity-50">x Ant Media</span>
                </h1>
                <p className="text-zinc-400 mt-3 text-lg">
                    Demonstrating Real-Time Streaming Capabilities
                </p>
            </header>

            <div className="flex flex-wrap gap-4 mb-12 justify-center">
                <button
                    onClick={() => setMode('broadcast')}
                    className={`px-6 py-2.5 rounded-full border transition-all font-medium ${mode === 'broadcast' ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-900/20' : 'border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-500'}`}
                >
                    Start Broadcast
                </button>
                <button
                    onClick={() => setMode('play')}
                    className={`px-6 py-2.5 rounded-full border transition-all font-medium ${mode === 'play' ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-900/20' : 'border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-500'}`}
                >
                    Watch Stream
                </button>
                <button
                    onClick={() => setMode('p2p')}
                    className={`px-6 py-2.5 rounded-full border transition-all font-medium ${mode === 'p2p' ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-900/20' : 'border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-500'}`}
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

                {/* Use the stylized LiveStreamPlayer for playback */}
                {mode === 'play' && (
                    <div className="w-full max-w-4xl mx-auto">
                        {userId ? (
                            <LiveStreamPlayer streamId={userId} />
                        ) : (
                            <div className="text-center p-12 bg-zinc-900 rounded-xl border border-zinc-800">
                                <p className="text-zinc-400">No stream ID provided</p>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'p2p' && (
                    <AntMediaProvider key="p2p" role="p2p">
                        <div className="space-y-4">
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
