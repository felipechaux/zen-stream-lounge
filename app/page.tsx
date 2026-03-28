'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, MapPin, Users, Camera, Radio, RefreshCw, Sparkles } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MOCK_STREAMERS } from "@/data/mockStreamers";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveStreams, LiveStream } from "@/hooks/use-live-streams";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const { streams, count, loading: streamsLoading, error: streamsError, refetch } = useLiveStreams(30_000);

  useEffect(() => {
    if (!loading && user && role === 'model') {
      router.push('/dashboard');
    }
  }, [user, role, loading, router]);

  const filteredMock = searchQuery
    ? MOCK_STREAMERS.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : MOCK_STREAMERS;

  const categories = [
    "Featured", "Top Rated", "New Models", "Latina", "Blonde", "Ebony", "Asian", "Couples"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
      />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative h-[65vh] md:h-[78vh] min-h-[600px] overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/girl-bg.png"
            alt="Premium Live Experience"
            fill
            className="object-cover object-top"
            priority
          />
          {/* Cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/95 via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent" />
          {/* Ambient color bleed */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_60%,rgba(245,158,11,0.07)_0%,transparent_70%)]" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex items-center pb-28 md:pb-36">
          <div className="max-w-3xl space-y-7 pt-20 animate-fade-up">
            {/* Live count pill */}
            <div className="flex items-center gap-3">
              {count > 0 ? (
                <div className="flex items-center gap-2 bg-red-600/90 text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                  <span className="live-dot" />
                  {count} Live Now
                </div>
              ) : (
                <Badge className="bg-amber-500/90 text-black hover:bg-amber-400 border-none px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-sm rounded-full">
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Premium Platform
                </Badge>
              )}
            </div>

            {/* Display heading — Playfair Display */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight text-white drop-shadow-2xl">
              Experience the{' '}
              <span className="text-gradient-luxury italic">Intimacy</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed font-light">
              Interact with the world&apos;s most stunning models in real-time.
              Private shows, exclusive content, and unforgettable moments.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black border-none rounded-full shadow-xl shadow-amber-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Watching Free
              </Button>
              <Link href="/auth">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base border-white/20 text-white/80 hover:bg-white/[0.07] hover:text-white hover:border-white/30 rounded-full backdrop-blur-sm transition-all duration-200"
                >
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="container mx-auto px-4 pb-24 -mt-16 relative z-10 w-full">

        {/* Tab filters */}
        <Tabs defaultValue="all" className="w-full mb-10">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap no-scrollbar snap-x snap-mandatory bg-white/[0.04] backdrop-blur-xl p-1.5 border border-white/[0.07] rounded-2xl shadow-glass">
            {["All Models", "Featured", "New & Hot", "VR Cam", "4K Ultra HD"].map((label, i) => {
              const value = ["all", "featured", "new", "vr", "4k"][i];
              return (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="snap-start data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:shadow-lg text-zinc-500 rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:text-white hover:bg-white/[0.06]"
                >
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* ── Live Streams ───────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">On Air Now</h2>
              {count > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {count} Live
                </span>
              )}
            </div>
            <button
              onClick={refetch}
              className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs transition-colors duration-150 group"
              aria-label="Refresh streams"
            >
              <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </button>
          </div>

          {streamsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03]">
                  <div
                    className="aspect-[3/4] bg-gradient-to-br from-white/[0.05] to-white/[0.02]"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                      backgroundSize: '200% auto',
                      animation: 'shimmer 1.8s linear infinite',
                    }}
                  />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-white/[0.06] rounded-full w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : streams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {streams.map((stream) => (
                <LiveStreamCard
                  key={stream.streamId}
                  stream={stream}
                  onClick={() => router.push(`/streaming?mode=play&id=${stream.streamId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                <Radio className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium text-sm">No streams live right now</p>
              <p className="text-zinc-600 text-xs mt-1.5">
                {streamsError ?? 'Performers go live every hour — check back soon'}
              </p>
            </div>
          )}
        </section>

        {/* ── Performers Catalog ─────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">Browse Performers</h2>
            <span className="text-zinc-600 text-sm">{filteredMock.length} models</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMock.map((streamer) => (
              <PerformerCard
                key={streamer.id}
                streamer={streamer}
                onClick={() => router.push(`/streaming?mode=play&id=${streamer.id}`)}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-8 text-sm border-white/[0.1] text-zinc-400 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.2] rounded-full transition-all duration-200"
            >
              Load More Models
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ── Live Stream Card ─────────────────────────────────── */
function LiveStreamCard({ stream, onClick }: { stream: LiveStream; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="group relative rounded-2xl overflow-hidden border border-red-900/30 hover:border-red-500/40 cursor-pointer transition-all duration-300 glow-red-hover"
      style={{ background: 'var(--glass-bg)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Watch ${stream.name} live`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
        {!imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={stream.thumbnailUrl}
            alt={`${stream.name} live stream thumbnail`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <Radio className="h-10 w-10 text-zinc-700" />
          </div>
        )}

        {/* Live badge */}
        <div className="absolute top-3 left-3 live-badge">
          <span className="live-dot" />
          Live
        </div>

        {/* Viewer count */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/[0.08]">
          <Users className="h-3 w-3 text-amber-400" />
          {stream.viewers > 0 ? stream.viewers.toLocaleString() : '—'}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl shadow-red-900/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-7 w-7 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-display text-white font-semibold text-base truncate">{stream.name}</h3>
          <p className="text-zinc-400 text-xs mt-0.5">Tap to watch live</p>
        </div>
      </div>

      <div className="px-3 py-2.5 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Broadcasting</span>
          <span className="text-[10px] text-zinc-700 font-mono truncate max-w-[100px]">{stream.streamId}</span>
        </div>
      </div>
    </article>
  );
}

/* ── Performer Card ───────────────────────────────────── */
function PerformerCard({
  streamer,
  onClick,
}: {
  streamer: typeof MOCK_STREAMERS[0];
  onClick: () => void;
}) {
  return (
    <article
      className="group relative rounded-2xl overflow-hidden border border-white/[0.07] hover:border-amber-500/30 cursor-pointer transition-all duration-300 glow-amber-hover"
      style={{ background: 'var(--glass-bg)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View ${streamer.name}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={streamer.image}
          alt={streamer.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Live badge */}
        {streamer.isLive && (
          <div className="absolute top-3 left-3 live-badge">
            <span className="live-dot" />
            Live
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide
          ${streamer.status === 'private'
            ? 'bg-purple-600/90 text-white border border-purple-400/20'
            : streamer.status === 'ticket'
            ? 'bg-emerald-600/90 text-white border border-emerald-400/20'
            : 'bg-black/60 text-zinc-300 border border-white/[0.1] backdrop-blur-sm'
          }`}
        >
          {streamer.status === 'ticket' ? 'Ticket' : streamer.status}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
          <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center shadow-xl shadow-amber-900/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-7 w-7 text-black fill-black ml-1" />
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-display text-white font-semibold text-base mb-1 flex items-center gap-1.5">
            {streamer.name}
            {streamer.isPremium && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
          </h3>
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {streamer.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {streamer.viewers.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tags footer */}
      <div className="px-3 py-2.5 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-1.5">
          {streamer.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[9px] uppercase tracking-widest text-zinc-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md font-medium hover:text-zinc-300 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
