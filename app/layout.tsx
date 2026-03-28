import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from './providers'
import CookieConsent from '@/components/layout/CookieConsent';
import { LanguageProvider } from '@/contexts/LanguageContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata = {
  title: 'ZenStream Lounge - Premium Streaming Platform',
  description: 'Premium streaming platform for exclusive content.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
        <QueryProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
              <CookieConsent />
            </TooltipProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
