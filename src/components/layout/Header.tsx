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
import { Search, User, Settings, Bell, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  categories?: string[];
}

export default function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { user, signOut, loading, role } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06]"
      style={{
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href={role === 'model' ? "/dashboard" : "/"} className="flex-shrink-0">
            <span className="font-display text-xl font-bold text-gradient-amber tracking-tight cursor-pointer select-none">
              ZenStream
            </span>
          </Link>

          {/* Search — center, only for users/visitors */}
          {role !== 'model' && (
            <div className={`relative hidden sm:flex flex-1 max-w-sm transition-all duration-300 ${searchFocused ? 'max-w-md' : ''}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 h-4 w-4 pointer-events-none" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-9 h-9 bg-white/[0.05] border-white/[0.08] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/40 focus:ring-amber-500/20 focus:bg-white/[0.08] rounded-lg text-sm transition-all duration-200"
              />
            </div>
          )}

          {/* Model nav */}
          {role === 'model' && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/dashboard', label: t('overview') },
                { href: '/dashboard/schedule', label: t('schedule') },
                { href: '/dashboard/earnings', label: t('earnings') },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <Button variant="ghost" className="text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] h-8 px-3 transition-colors duration-150">
                    {label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-200 text-zinc-400 hover:text-white"
              aria-label="Toggle language"
            >
              <span className="text-base leading-none">{language === 'en' ? '🇺🇸' : '🇪🇸'}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">{language === 'en' ? 'EN' : 'ES'}</span>
            </button>

            {!loading && user ? (
              <>
                {role === 'model' && (
                  <Link href="/streaming">
                    <Button className="hidden sm:flex h-8 px-4 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black border-none shadow-lg shadow-amber-900/25 transition-all duration-200 rounded-lg">
                      {t('goLive')}
                    </Button>
                  </Link>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded-lg relative"
                  aria-label={t('notifications')}
                >
                  <Bell className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/20 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      aria-label="User menu"
                    >
                      <User className="h-3.5 w-3.5 text-amber-400" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#09090b]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-zinc-950/95 border-white/[0.08] text-zinc-200 backdrop-blur-xl shadow-2xl rounded-xl p-1"
                  >
                    <div className="px-3 py-2.5 hidden sm:block">
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      <p className="text-xs text-amber-500 mt-0.5 font-medium">
                        {role === 'model' ? t('creatorAccount') : t('memberAccount')}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/[0.06] hidden sm:block" />

                    {role === 'model' && (
                      <DropdownMenuItem asChild className="rounded-lg focus:bg-white/[0.06] cursor-pointer">
                        <Link href="/dashboard" className="w-full flex items-center">
                          <LayoutDashboard className="mr-2.5 h-4 w-4 text-zinc-400" />
                          {t('creatorStudio')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-white/[0.06] cursor-pointer">
                      <Link href="/profile" className="w-full flex items-center">
                        <User className="mr-2.5 h-4 w-4 text-zinc-400" />
                        {t('profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-white/[0.06] cursor-pointer">
                      <Link href="/settings" className="w-full flex items-center">
                        <Settings className="mr-2.5 h-4 w-4 text-zinc-400" />
                        {t('settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/[0.06]" />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="rounded-lg cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-950/30"
                    >
                      <LogOut className="mr-2.5 h-4 w-4" />
                      {t('signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex h-8 px-4 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-300 rounded-lg transition-all duration-200"
                  >
                    {t('signIn')}
                  </Button>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button
                    size="sm"
                    className="hidden md:flex h-8 px-4 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold border-none shadow-lg shadow-amber-900/20 rounded-lg transition-all duration-200"
                  >
                    {t('joinFree')}
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
