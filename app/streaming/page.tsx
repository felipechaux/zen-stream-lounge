'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
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
    // For P2P demo
    const [userId, setUserId] = useState('');
    const [inputId, setInputId] = useState('');
    const [peerId, setPeerId] = useState('user2');

    React.useEffect(() => {
        const idParam = searchParams.get('id');
        const peerParam = searchParams.get('peer');
        if (idParam) {
            setUserId(idParam);
            setInputId(idParam);
        }
        if (peerParam) setPeerId(peerParam);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <header className="mb-12 border-b border-zinc-800 pb-6">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                    ZenStream Lounge <span className="text-white text-2xl font-normal ml-2 opacity-50">x Ant Media</span>
                </h1>
                <p className="text-zinc-400 mt-3 text-lg">
                    Demonstrating Real-Time Streaming Capabilities
                </p>

                <div className="absolute top-8 right-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
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
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                        <div className="flex gap-2 justify-center max-w-md mx-auto">
                            <input
                                type="text"
                                value={inputId}
                                onChange={(e) => setInputId(e.target.value)}
                                placeholder="Enter Stream ID to Watch"
                                className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setUserId(inputId);
                                    }
                                }}
                            />
                            <button
                                onClick={() => setUserId(inputId)}
                                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                            >
                                Play
                            </button>
                        </div>

                        {userId ? (
                            <LiveStreamPlayer streamId={userId} />
                        ) : (
                            <div className="text-center p-12 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                <p className="text-zinc-400">Enter a Stream ID above to start watching</p>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'p2p' && (
                    <div className="space-y-4">
                        <OneToOneCall streamId={userId} peerStreamId={peerId} />
                    </div>
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
