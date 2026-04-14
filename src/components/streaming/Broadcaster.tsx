'use client';

import React, { useState } from 'react';
import { Radio, Square, Wifi, WifiOff } from 'lucide-react';
import { useAntMedia } from './AntMediaProvider';

interface BroadcasterProps {
    streamId?: string
}

export default function Broadcaster({ streamId: propStreamId }: BroadcasterProps) {
    const { isConnected, publish, stop } = useAntMedia();
    const [streamId] = useState(propStreamId || `stream-${Math.floor(Math.random() * 10000)}`);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleStart = () => { publish(streamId); setIsPublishing(true);  };
    const handleStop  = () => { stop(streamId);    setIsPublishing(false); };

    return (
        <div className="max-w-2xl mx-auto space-y-4">

            {/* Video preview */}
            <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/[0.07]">
                <video
                    id="localVideo"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Status badge */}
                <div className="absolute top-3 left-3">
                    {isPublishing ? (
                        <div className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-white text-xs font-bold uppercase tracking-wider">Live</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/[0.08]">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            <span className="text-zinc-400 text-xs font-medium">Offline</span>
                        </div>
                    )}
                </div>

                {/* Connection indicator */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/[0.08]">
                    {isConnected
                        ? <Wifi className="h-3 w-3 text-emerald-400" />
                        : <WifiOff className="h-3 w-3 text-zinc-600" />
                    }
                    <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {isConnected ? 'Ready' : 'Connecting…'}
                    </span>
                </div>

                {/* Offline overlay */}
                {!isPublishing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/60">
                        <Radio className="h-10 w-10 text-zinc-700" />
                        <span className="text-zinc-500 text-sm">Camera preview will appear here</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    <span className="text-zinc-500">{isConnected ? 'Server connected' : 'Disconnected'}</span>
                </div>

                {!isPublishing ? (
                    <button
                        onClick={handleStart}
                        disabled={!isConnected}
                        className="flex items-center gap-2 h-10 px-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm shadow-lg shadow-amber-900/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <Radio className="h-4 w-4" />
                        Go Live
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="flex items-center gap-2 h-10 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all duration-200"
                    >
                        <Square className="h-3.5 w-3.5 fill-white" />
                        End Stream
                    </button>
                )}
            </div>

            {/* Live notice */}
            {isPublishing && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    You are live. Closing or refreshing this tab will end the broadcast.
                </div>
            )}
        </div>
    );
}
