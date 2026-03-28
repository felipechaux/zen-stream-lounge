'use client'

import Link from "next/link";
import { Twitter, Instagram, Lock, Shield } from "lucide-react";

const footerLinks = {
  Discover: [
    { label: 'Top Rated', href: '/top-rated' },
    { label: 'New Models', href: '/new' },
    { label: 'Categories', href: '/categories' },
    { label: 'Live Now', href: '/' },
  ],
  Membership: [
    { label: 'Member Login', href: '/auth' },
    { label: 'Sign Up Free', href: '/auth' },
    { label: 'Member Benefits', href: '/benefits' },
    { label: 'Premium Plans', href: '/plans' },
  ],
  Support: [
    { label: '24/7 Support', href: '/help' },
    { label: 'Billing Support', href: '/billing-support' },
    { label: 'Safety Center', href: '/safety' },
    { label: 'Terms & Privacy', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ],
};

export default function Footer() {
  return (
    <footer
      className="w-full border-t border-white/[0.06] pt-16 pb-8 mt-auto"
      style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.95) 100%)',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="space-y-4 lg:pr-4">
            <span className="font-display text-xl font-bold text-gradient-amber tracking-tight">
              ZenStream Lounge
            </span>
            <p className="text-zinc-500 text-sm leading-relaxed mt-3">
              The world&apos;s premier destination for exclusive live entertainment. Experience true premium quality.
            </p>
            <div className="flex items-center gap-2 pt-2">
              {[
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-amber-400 hover:bg-white/[0.06] transition-all duration-200 border border-white/[0.05] hover:border-amber-500/20"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-5">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-600 hover:text-zinc-200 transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-zinc-700 order-2 sm:order-1" suppressHydrationWarning>
            © {new Date().getFullYear()} ZenStream Lounge. All rights reserved. 18+ Only.
          </p>
          <div className="flex items-center gap-4 order-1 sm:order-2">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-700">
              <Lock className="h-3 w-3" />
              SSL Secured
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-700">
              <Shield className="h-3 w-3" />
              Age Verified
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
