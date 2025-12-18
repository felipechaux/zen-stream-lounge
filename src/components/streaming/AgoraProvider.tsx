'use client'

import AgoraRTC from "agora-rtc-sdk-ng";
import { AgoraRTCProvider } from "agora-rtc-react";
import { ReactNode, useEffect, useState } from "react";

interface AgoraProviderProps {
  children: ReactNode;
}

const AgoraProvider = ({ children }: AgoraProviderProps) => {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Create Agora client with RTC mode and VP8 codec
    const agoraClient = AgoraRTC.createClient({ 
      mode: "rtc", 
      codec: "vp8" 
    });
    
    setClient(agoraClient);

    // Cleanup function
    return () => {
      if (agoraClient) {
        agoraClient.leave();
      }
    };
  }, []);

  // Don't render children until client is ready
  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Initializing streaming...</div>
      </div>
    );
  }

  return (
    <AgoraRTCProvider client={client}>
      {children}
    </AgoraRTCProvider>
  );
};

export default AgoraProvider;
