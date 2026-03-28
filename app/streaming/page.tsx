'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio, Play, Video } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import AntMediaProvider from '@/components/streaming/AntMediaProvider';
import OneToOneCall from '@/components/streaming/OneToOneCall';
import Broadcaster from '@/components/streaming/Broadcaster';
import dynamic from 'next/dynamic';
const LiveStreamPlayer = dynamic(() => import('@/components/streaming/LiveStreamPlayer'), { ssr: false });

const MODES = [
  { value: 'broadcast', label: 'Go Live', icon: Radio },
  { value: 'play',      label: 'Watch',   icon: Play },
  { value: 'p2p',       label: '1-to-1',  icon: Video },
] as const;

type Mode = typeof MODES[number]['value'];

function AntMediaContent() {
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<Mode>('broadcast');
    const [cameraReady, setCameraReady] = useState(false);
    const [userId, setUserId] = useState('');
    const [inputId, setInputId] = useState('');
    const [peerId, setPeerId] = useState('user2');

    React.useEffect(() => {
        const modeParam = searchParams.get('mode');
        if (modeParam && ['p2p', 'broadcast', 'play'].includes(modeParam)) {
            setMode(modeParam as Mode);
        }
        const idParam = searchParams.get('id');
        const peerParam = searchParams.get('peer');
        if (idParam) { setUserId(idParam); setInputId(idParam); }
        if (peerParam) setPeerId(peerParam);
    }, [searchParams]);

    const handleModeChange = (m: Mode) => {
        setMode(m);
        setCameraReady(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Top bar */}
            <div
                className="sticky top-0 z-40 border-b border-white/[0.06] px-4 py-3"
                style={{ background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors duration-150 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
                        <span className="font-display font-semibold text-gradient-amber text-base">ZenStream</span>
                    </Link>

                    {/* Mode tabs */}
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
                        {MODES.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => handleModeChange(value)}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    mode === value
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-lg shadow-amber-900/25'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="w-20" /> {/* spacer */}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* ── Broadcast Mode ── */}
                {mode === 'broadcast' && (
                    cameraReady ? (
                        <AntMediaProvider key="broadcast" role="publisher">
                            <Broadcaster />
                        </AntMediaProvider>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center border border-white/[0.08]"
                                style={{ background: 'var(--glass-bg)' }}
                            >
                                <Radio className="h-9 w-9 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="font-display text-2xl font-bold text-white">Start Your Broadcast</h2>
                                <p className="text-zinc-500 text-sm max-w-xs">
                                    Your browser will request camera and microphone access to begin streaming.
                                </p>
                            </div>
                            <button
                                onClick={() => setCameraReady(true)}
                                className="flex items-center gap-2 h-12 px-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm shadow-xl shadow-amber-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Radio className="h-4 w-4" />
                                Enable Camera &amp; Go Live
                            </button>
                        </div>
                    )
                )}

                {/* ── Watch Mode ── */}
                {mode === 'play' && (
                    <div className="w-full space-y-5">
                        <div
                            className="flex gap-2 max-w-md mx-auto p-1 rounded-xl border border-white/[0.08]"
                            style={{ background: 'var(--glass-bg)' }}
                        >
                            <input
                                type="text"
                                value={inputId}
                                onChange={(e) => setInputId(e.target.value)}
                                placeholder="Enter stream ID to watch…"
                                className="flex-1 bg-transparent text-white placeholder:text-zinc-600 text-sm px-3 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && setUserId(inputId)}
                            />
                            <button
                                onClick={() => setUserId(inputId)}
                                disabled={!inputId.trim()}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Play className="h-3.5 w-3.5 fill-black" />
                                Play
                            </button>
                        </div>

                        {userId ? (
                            <LiveStreamPlayer streamId={userId} />
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/[0.06] gap-4 text-center"
                                style={{ background: 'var(--glass-bg)' }}
                            >
                                <Play className="h-10 w-10 text-zinc-700" />
                                <p className="text-zinc-500 text-sm">Enter a stream ID above to start watching</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── P2P Mode ── */}
                {mode === 'p2p' && (
                    <OneToOneCall streamId={userId} peerStreamId={peerId} />
                )}
            </div>
        </div>
    );
}

export default function AntMediaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-400">
                    <Radio className="h-5 w-5 text-amber-500 animate-pulse" />
                    <span className="text-sm">Loading studio…</span>
                </div>
            </div>
        }>
            <AntMediaContent />
        </Suspense>
    );
}
