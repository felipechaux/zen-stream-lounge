'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AntMediaProvider from '@/components/streaming/AntMediaProvider';
import OneToOneCall from '@/components/streaming/OneToOneCall';
import Broadcaster from '@/components/streaming/Broadcaster';
import PrivateCallViewer from '@/components/streaming/PrivateCallViewer';
import dynamic from 'next/dynamic';
const LiveStreamPlayer = dynamic(() => import('@/components/streaming/LiveStreamPlayer'), { ssr: false });

type Mode = 'broadcast' | 'play';

function AntMediaContent() {
    const searchParams  = useSearchParams();
    const { user, role } = useAuth();
    const [cameraReady, setCameraReady] = useState(false);

    const streamIdParam = searchParams.get('id');
    const modeParam     = searchParams.get('mode');
    const [callActive, setCallActive] = useState(false);

    // Viewer arriving from homepage stream card
    const isViewerMode = modeParam === 'play' && !!streamIdParam;

    // Stable per user — memoized so it never changes between renders
    const streamerStreamId = useMemo(
        () => user?.id ? `host-${user.id.slice(0, 12)}` : '',
        [user?.id]
    );

    // ── Viewer experience ─────────────────────────────────────────────────────
    if (isViewerMode) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <div
                    className="sticky top-0 z-40 border-b border-white/[0.06] px-4 py-3"
                    style={{ background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                >
                    <div className="max-w-6xl mx-auto flex items-center gap-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors duration-150 group"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
                            <span className="font-display font-semibold text-gradient-amber text-base">ZenStream</span>
                        </Link>
                        <span className="text-zinc-700">·</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-zinc-400 text-sm font-medium">Live</span>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {!callActive && <LiveStreamPlayer streamId={streamIdParam!} />}
                    <PrivateCallViewer streamId={streamIdParam!} onCallActive={setCallActive} />
                </div>
            </div>
        );
    }

    // ── Streamer studio — broadcast + private call panel side by side ─────────
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Top bar */}
            <div
                className="sticky top-0 z-40 border-b border-white/[0.06] px-4 py-3"
                style={{ background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link
                        href={role === 'model' ? '/dashboard' : '/'}
                        className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors duration-150 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
                        <span className="font-display font-semibold text-gradient-amber text-base">ZenStream</span>
                    </Link>
                    <span className="text-zinc-500 text-sm font-medium">Creator Studio</span>
                    <div className="w-24" />
                </div>
            </div>

            {/* Studio layout — broadcast (left) + private call panel (right) */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* ── Left: Broadcast ───────────────────────────────────── */}
                    <div className="w-full lg:flex-[2] min-w-0">
                        {/*
                         * AntMediaProvider stays mounted once camera is enabled.
                         * It is never unmounted while the streamer is on this page.
                         */}
                        {cameraReady ? (
                            <AntMediaProvider key="broadcast" role="publisher">
                                <Broadcaster streamId={streamerStreamId} />
                            </AntMediaProvider>
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] py-20 text-center gap-6"
                                style={{ background: 'var(--glass-bg)' }}
                            >
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
                        )}
                    </div>

                    {/* ── Right: Private call panel ─────────────────────────── */}
                    {streamerStreamId && (
                        <div className="w-full lg:w-80 lg:flex-shrink-0">
                            <OneToOneCall streamId={streamerStreamId} />
                        </div>
                    )}
                </div>
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
