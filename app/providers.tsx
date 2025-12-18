'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { AuthProvider } from '@/contexts/AuthContext';
import AgoraProvider from '@/components/streaming/AgoraProvider';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <AgoraProvider>
            {children}
          </AgoraProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
