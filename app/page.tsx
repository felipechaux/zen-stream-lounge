'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, MapPin, Users, Heart, Camera } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MOCK_STREAMERS, Streamer } from "@/data/mockStreamers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role === 'model') {
      router.push('/dashboard');
    }
  }, [user, role, loading, router]);

  const categories = [
    "Featured", "Top Rated", "New Models", "Latina", "Blonde", "Ebony", "Asian", "Couples"
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
      />

      {/* Hero / Banner Area */}
      <section className="relative h-[65vh] md:h-[75vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/girl-bg.png"
            alt="Premium Live Experience"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex items-center pb-32 md:pb-40">
          <div className="max-w-3xl space-y-8 pt-24">
            <Badge className="bg-amber-500 text-black hover:bg-amber-400 border-none px-4 py-1.5 text-sm font-bold uppercase tracking-wide">
              Live Now
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight text-white drop-shadow-2xl">
              Experience the <br /> <span className="text-amber-500">Intimacy</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-xl leading-relaxed drop-shadow-md">
              Interact with the world&apos;s most stunning models in real-time. Private shows, exclusive content, and unforgettable moments wait for you.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-8">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-500 text-white border-none text-xl px-10 h-14 rounded-full shadow-xl shadow-amber-900/20 transition-all hover:scale-105">
                <Camera className="mr-2 h-6 w-6" />
                Start Watching Free
              </Button>
              <Link href="/auth">
                <Button variant="outline" size="lg" className="border-amber-500/50 text-amber-500 hover:bg-amber-950/30 text-xl px-10 h-14 rounded-full backdrop-blur-sm transition-all hover:scale-105">
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pb-20 -mt-20 relative z-10 w-full">

        {/* Filters/Tabs */}
        <Tabs defaultValue="all" className="w-full mb-12">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-zinc-900/90 backdrop-blur-xl p-2 border border-zinc-800/50 rounded-2xl shadow-2xl no-scrollbar snap-x snap-mandatory scroll-pl-6">
            <TabsTrigger value="all" className="snap-start data-[state=active]:bg-amber-600 data-[state=active]:text-white text-zinc-400 rounded-xl px-6 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 hover:bg-zinc-800 hover:text-white">All Models</TabsTrigger>
            <TabsTrigger value="featured" className="snap-start data-[state=active]:bg-amber-600 data-[state=active]:text-white text-zinc-400 rounded-xl px-6 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 hover:bg-zinc-800 hover:text-white">Featured</TabsTrigger>
            <TabsTrigger value="new" className="snap-start data-[state=active]:bg-amber-600 data-[state=active]:text-white text-zinc-400 rounded-xl px-6 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 hover:bg-zinc-800 hover:text-white">New & Hot</TabsTrigger>
            <TabsTrigger value="vr" className="snap-start data-[state=active]:bg-amber-600 data-[state=active]:text-white text-zinc-400 rounded-xl px-6 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 hover:bg-zinc-800 hover:text-white">VR Cam</TabsTrigger>
            <TabsTrigger value="4k" className="snap-start data-[state=active]:bg-amber-600 data-[state=active]:text-white text-zinc-400 rounded-xl px-6 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 hover:bg-zinc-800 hover:text-white">4K Ultra HD</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Streamers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_STREAMERS.map((streamer) => (
            <div
              key={streamer.id}
              className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-900/10 cursor-pointer"
              onClick={() => router.push(`/streaming?mode=play&id=${streamer.id}`)}
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={streamer.image}
                  alt={streamer.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Live Badge */}
                {streamer.isLive && (
                  <div className="absolute top-3 left-3 flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold uppercase animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    <span>LIVE</span>
                  </div>
                )}

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold uppercase
                  ${streamer.status === 'private' ? 'bg-purple-600 text-white' :
                    streamer.status === 'ticket' ? 'bg-green-600 text-white' :
                      'bg-zinc-900/80 text-white backdrop-blur-sm'}`}>
                  {streamer.status === 'ticket' ? 'Ticket Show' : streamer.status}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-16 h-16 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg shadow-amber-500/50 transform scale-50 group-hover:scale-100 transition-transform duration-300">
                    <Play className="h-8 w-8 text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Preview Info (Bottom of Image) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center">
                    {streamer.name}
                    {streamer.isPremium && <Star className="h-4 w-4 text-amber-500 fill-amber-500 ml-2" />}
                  </h3>
                  <div className="flex items-center justify-between text-zinc-300 text-xs font-medium">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{streamer.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{streamer.viewers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  {streamer.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2 py-1 rounded-sm border border-zinc-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8">
            Load More Models
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
