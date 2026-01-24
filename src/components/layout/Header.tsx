'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Filter, User, Settings, Bell, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  categories?: string[];
}

export default function Header({ searchQuery, setSearchQuery, categories = [] }: HeaderProps) {
  const { user, signOut, loading, role } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-zinc-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href={role === 'model' ? "/dashboard" : "/"}>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent cursor-pointer">
                ZenStream Lounge
              </h1>
            </Link>

            {/* Navigation - Different for Models vs Users */}
            <nav className="hidden md:flex space-x-6">
              {role === 'model' ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="text-sm hover:text-amber-500">Overview</Button>
                  </Link>
                  <Link href="/dashboard/schedule">
                    <Button variant="ghost" className="text-sm hover:text-amber-500">Schedule</Button>
                  </Link>
                  <Link href="/dashboard/earnings">
                    <Button variant="ghost" className="text-sm hover:text-amber-500">Earnings</Button>
                  </Link>
                </>
              ) : (
                categories.map((category) => (
                  <Button key={category} variant="ghost" className="text-sm hover:text-amber-500">
                    {category}
                  </Button>
                ))
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search - Only for regular users or visitors */}
            {role !== 'model' && (
              <div className="relative max-w-sm hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Show different buttons based on authentication state */}
            {loading ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="h-4 w-4" />
              </Button>
            ) : user ? (
              <>
                {role === 'model' && (
                  <Link href="/streaming">
                    <Button className="hidden sm:flex bg-amber-600 hover:bg-amber-500 text-white font-bold border-none shadow-lg shadow-amber-900/20">
                      Go Live
                    </Button>
                  </Link>
                )}

                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>

                {/* User dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <User className="h-4 w-4" />
                      <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-zinc-950"></div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200">
                    <DropdownMenuItem className="flex-col items-start hidden sm:flex focus:bg-zinc-800 focus:text-white">
                      <div className="font-medium text-white">{user.email}</div>
                      <div className="text-xs text-amber-500 capitalize">{role === 'model' ? 'Creator Account' : 'Member Account'}</div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800 hidden sm:block" />

                    {role === 'model' && (
                      <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white">
                        <Link href="/dashboard" className="w-full cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Creator Studio
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white">
                      <Link href="/profile" className="w-full cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white">
                      <Link href="/settings" className="w-full cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-950/20">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" size="sm" className="hidden md:flex border-amber-500/50 text-amber-500 hover:bg-amber-950/30">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
