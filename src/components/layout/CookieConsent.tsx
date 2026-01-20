'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Show immediately or after a small delay
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-zinc-950/95 backdrop-blur shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.5)] border-t border-zinc-800 border-amber-500/20 animate-in slide-in-from-bottom duration-500">
            <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
                        <span className="text-amber-500">🍪</span> Cookie Settings
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        We use cookies and similar technologies, including third-party cookies, to improve your experience,
                        personalize content, analyze traffic and user activity, and for promotion purposes.
                        To learn more about our cookies, please read our{' '}
                        <Link href="/cookie-policy" className="text-amber-500 hover:text-amber-400 hover:underline font-medium">
                            Cookie Policy
                        </Link>.
                    </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Button
                        variant="outline"
                        onClick={handleDecline}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                        Decline
                    </Button>
                    <Button
                        onClick={handleAccept}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 shadow-lg shadow-amber-900/20"
                    >
                        Accept All
                    </Button>
                </div>
            </div>
        </div>
    );
}
