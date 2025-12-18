import StreamingRoom from '@/components/streaming/StreamingRoom';

export default function StreamingPage() {
  // You'll need to get your Agora App ID from the Agora Console
  // For now, we'll use a placeholder - replace with your actual App ID
  const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "your-agora-app-id";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Zen Stream Lounge</h1>
          <p className="text-lg text-muted-foreground">
            Experience premium streaming with real-time video and audio
          </p>
        </div>
        
        <StreamingRoom appId={AGORA_APP_ID} />
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            To get started, you'll need to:
          </p>
          <ol className="list-decimal list-inside mt-4 space-y-2">
            <li>Create an account at <a href="https://console.agora.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">Agora Console</a></li>
            <li>Create a new project and get your App ID</li>
            <li>Add your App ID to your environment variables as NEXT_PUBLIC_AGORA_APP_ID</li>
            <li>For production use, also set up token authentication</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
