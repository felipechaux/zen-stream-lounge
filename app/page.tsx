'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Star, Clock } from "lucide-react";
import Image from 'next/image';
import Header from '@/components/layout/Header';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "Trending", "New Releases", "Popular", "Premium", "Live", "Categories"
  ];

  const featuredContent = [
    {
      id: 1,
      title: "Featured Series",
      description: "An exclusive premium series with stunning visuals and compelling storylines",
      image: "/content-1.jpg",
      rating: 4.8,
      duration: "45 min",
      category: "Premium"
    },
    {
      id: 2,
      title: "Popular Collection",
      description: "Most watched content this month",
      image: "/content-1.jpg",
      rating: 4.6,
      duration: "30 min",
      category: "Trending"
    },
    {
      id: 3,
      title: "New Release",
      description: "Just added to our platform",
      image: "/content-1.jpg",
      rating: 4.9,
      duration: "60 min",
      category: "New"
    }
  ];

  // Create deterministic content grid to avoid hydration mismatches
  const contentGrid = Array.from({ length: 12 }, (_, i) => ({
    id: i + 4,
    title: `Content ${i + 1}`,
    image: "/content-1.jpg",
    rating: (4.0 + (i * 0.1) % 1).toFixed(1),
    duration: `${20 + (i * 5) % 40} min`,
    category: categories[i % categories.length]
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
      />

      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="/girl-bg.png"
            alt="High quality AI attractive girl background" 
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6">
            <Badge variant="secondary" className="text-sm">
              Featured Premium
            </Badge>
            <h2 className="text-5xl font-bold leading-tight">
              Exclusive Premium Collection
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover our most exclusive and high-quality content, carefully curated for discerning viewers.
            </p>
            <div className="flex items-center space-x-4">
              <Button size="lg" className="text-lg px-8">
                <Play className="mr-2 h-5 w-5" />
                Watch Now
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                More Info
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="container mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold mb-8">Featured Content</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featuredContent.map((item) => (
            <Card key={item.id} className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative">
                <Image 
                  src={item.image}
                  alt={item.title}
                  width={400}
                  height={192}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button size="lg" variant="secondary">
                    <Play className="mr-2 h-5 w-5" />
                    Play
                  </Button>
                </div>
                <Badge className="absolute top-2 right-2">
                  {item.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{item.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{item.duration}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Content Grid */}
      <section className="container mx-auto px-4 pb-12">
        <h3 className="text-3xl font-bold mb-8">All Content</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {contentGrid.map((item) => (
            <Card key={item.id} className="group cursor-pointer overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="relative">
                <Image 
                  src={item.image}
                  alt={item.title}
                  width={200}
                  height={160}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button size="sm" variant="secondary">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                  {item.category}
                </Badge>
              </div>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-2 truncate">{item.title}</h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{item.rating}</span>
                  </div>
                  <span>{item.duration}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">StreamVault</h4>
              <p className="text-muted-foreground text-sm">
                Premium streaming platform for exclusive content.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Browse</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Trending</li>
                <li>New Releases</li>
                <li>Categories</li>
                <li>Premium</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Account</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Profile</li>
                <li>Settings</li>
                <li>Subscription</li>
                <li>History</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Support</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Contact</li>
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 mt-6 text-center text-sm text-muted-foreground">
            © 2024 StreamVault. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
