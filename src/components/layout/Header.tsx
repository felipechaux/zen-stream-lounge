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
import { Search, Filter, User, Settings, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: string[];
}

export default function Header({ searchQuery, setSearchQuery, categories }: HeaderProps) {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent cursor-pointer">
                ZenStream Lounge
              </h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/streaming">
                <Button variant="ghost" className="text-sm">
                  Live Stream
                </Button>
              </Link>
              {categories.map((category) => (
                <Button key={category} variant="ghost" className="text-sm">
                  {category}
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>

            {/* Show different buttons based on authentication state */}
            {loading ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="h-4 w-4" />
              </Button>
            ) : user ? (
              <>
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>

                {/* User dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex-col items-start">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">Premium Member</div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="sm">
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
