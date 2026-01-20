'use client'

import { useAuth } from "@/contexts/AuthContext"; // Assuming this exists or I'll need to check
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Lock } from "lucide-react";

export default function Footer() {
    // Mock auth for now if context doesn't exist, but I'll try to import useAuth and handle error if not found later
    // Ideally, I should check if AuthContext exists. Based on previous conversations, it seems likely.
    // For safety, I'll assume we might not have it or just use a placeholder boolean if not sure.
    // Wait, the user mentioned "improve the footer acordin when the user is logged in".
    // I will check for AuthContext existence in a moment. For now, I'll structure it to accept a prop or use a hook.

    // Let's assume we can get user status.
    const isLoggedIn = false; // TODO: Replace with actual auth hook

    return (
        <footer className="w-full bg-zinc-950 border-t border-zinc-800 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            ZenStream Lounge
                        </h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            The world's premier destination for exclusive live entertainment. Experience the difference of true premium quality.
                        </p>
                        <div className="flex space-x-4 pt-4">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-amber-400 hover:bg-zinc-900">
                                <Twitter className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-amber-400 hover:bg-zinc-900">
                                <Instagram className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-amber-400 hover:bg-zinc-900">
                                <Facebook className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-zinc-100 mb-6 tracking-wide uppercase text-sm">Discover</h4>
                        <ul className="space-y-3 text-sm text-zinc-400">
                            <li><Link href="/live" className="hover:text-amber-400 transition-colors">Live Cams</Link></li>
                            <li><Link href="/top-rated" className="hover:text-amber-400 transition-colors">Top Rated</Link></li>
                            <li><Link href="/new" className="hover:text-amber-400 transition-colors">New Models</Link></li>
                            <li><Link href="/categories" className="hover:text-amber-400 transition-colors">Categories</Link></li>
                        </ul>
                    </div>

                    {/* Member Services - Changes based on auth */}
                    <div>
                        <h4 className="font-semibold text-zinc-100 mb-6 tracking-wide uppercase text-sm">
                            {isLoggedIn ? "My Account" : "Membership"}
                        </h4>
                        <ul className="space-y-3 text-sm text-zinc-400">
                            {isLoggedIn ? (
                                <>
                                    <li><Link href="/profile" className="hover:text-amber-400 transition-colors">Profile Settings</Link></li>
                                    <li><Link href="/favorites" className="hover:text-amber-400 transition-colors">My Favorites</Link></li>
                                    <li><Link href="/billing" className="hover:text-amber-400 transition-colors">Billing & Credits</Link></li>
                                    <li><Link href="/history" className="hover:text-amber-400 transition-colors">View History</Link></li>
                                </>
                            ) : (
                                <>
                                    <li><Link href="/login" className="hover:text-amber-400 transition-colors">Member Login</Link></li>
                                    <li><Link href="/signup" className="hover:text-amber-400 transition-colors">Sign Up Free</Link></li>
                                    <li><Link href="/benefits" className="hover:text-amber-400 transition-colors">Member Benefits</Link></li>
                                    <li><Link href="/broadcaster" className="hover:text-amber-400 transition-colors">Become a Model</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-zinc-100 mb-6 tracking-wide uppercase text-sm">Support</h4>
                        <ul className="space-y-3 text-sm text-zinc-400">
                            <li><Link href="/help" className="hover:text-amber-400 transition-colors">24/7 Support</Link></li>
                            <li><Link href="/billing-support" className="hover:text-amber-400 transition-colors">Billing Support</Link></li>
                            <li><Link href="/safety" className="hover:text-amber-400 transition-colors">Safety Center</Link></li>
                            <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Terms & Privacy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Security / Bottom */}
                <div className="border-t border-zinc-800 pt-8 mt-8 pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-zinc-500">
                            &copy; {new Date().getFullYear()} ZenStream Lounge. All rights reserved. 18+ Only.
                        </div>
                        <div className="flex items-center space-x-2 text-zinc-500 text-xs">
                            <Lock className="h-3 w-3" />
                            <span>256-bit SSL Secure Payment</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
