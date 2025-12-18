# Streaming Features with Agora

This project now includes real-time video and audio streaming capabilities powered by Agora.

## Setup

1. **Get Agora Credentials**
   - Sign up at [Agora Console](https://console.agora.io)
   - Create a new project
   - Get your App ID from the project settings

2. **Environment Configuration**
   - Copy `.env.example` to `.env.local`
   - Add your Agora App ID:
     ```
     NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id_here
     ```

3. **Start Streaming**
   - Navigate to `/streaming` in your app
   - Enter a channel name and join to start streaming

## Features

### Current Implementation
- ✅ Real-time video and audio streaming
- ✅ Multiple participants support
- ✅ Video/audio toggle controls
- ✅ Responsive UI with Tailwind CSS
- ✅ Next.js App Router compatibility
- ✅ TypeScript support

### Components Structure

```
src/components/streaming/
├── AgoraProvider.tsx       # Agora RTC provider wrapper
└── StreamingRoom.tsx       # Main streaming interface

src/hooks/
└── useStreaming.ts         # Custom hook for streaming logic

app/
└── streaming/
    └── page.tsx            # Streaming demo page
```

## Usage

### Basic Streaming Room
```tsx
import StreamingRoom from '@/components/streaming/StreamingRoom';

export default function MyStreamingPage() {
  return (
    <StreamingRoom 
      appId={process.env.NEXT_PUBLIC_AGORA_APP_ID!}
      token={optionalToken} // For production use
    />
  );
}
```

### Custom Hook Usage
```tsx
import { useStreaming } from '@/hooks/useStreaming';

export default function CustomStreamingComponent() {
  const {
    joinChannel,
    leaveChannel,
    toggleVideo,
    toggleAudio,
    isConnected,
    remoteUsers,
    localCameraTrack
  } = useStreaming({
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!
  });

  return (
    // Your custom UI here
  );
}
```

## Token Authentication (Production)

For production use, implement token-based authentication:

1. Set up an Agora token server
2. Add your App Certificate to environment variables
3. Generate tokens server-side for enhanced security

## Next Steps

- [ ] Add screen sharing functionality
- [ ] Implement chat during streams
- [ ] Add stream recording capabilities
- [ ] Create stream management dashboard
- [ ] Add user permissions and roles
- [ ] Implement stream analytics

## Dependencies Added

- `agora-rtc-sdk-ng`: Core Agora RTC SDK
- `agora-rtc-react`: React hooks for Agora integration

## Resources

- [Agora Documentation](https://docs.agora.io)
- [Agora React SDK](https://github.com/AgoraIO-Extensions/agora-rtc-react)
- [Next.js Integration Guide](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
