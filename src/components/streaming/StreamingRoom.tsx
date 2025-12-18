'use client'

import { useEffect, useState } from "react";
import { useJoin, useLocalCameraTrack, useLocalMicrophoneTrack, usePublish, useRemoteAudioTracks, useRemoteUsers } from "agora-rtc-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";

interface StreamingRoomProps {
  appId: string;
  token?: string;
}

const StreamingRoom = ({ appId, token }: StreamingRoomProps) => {
  const [channelName, setChannelName] = useState("");
  const [uid, setUid] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [shouldJoin, setShouldJoin] = useState(false);

  // Agora hooks
  const { localCameraTrack } = useLocalCameraTrack(videoEnabled);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(audioEnabled);
  const { data: joinData, isLoading, isConnected } = useJoin({
    appid: appId,
    channel: channelName,
    token: token || null,
    uid: uid || null,
  }, shouldJoin && channelName !== "");
  
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Publish local tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Play remote audio tracks
  useEffect(() => {
    audioTracks.map((track) => track.play());
  }, [audioTracks]);

  const handleJoin = () => {
    if (!channelName.trim()) {
      alert("Please enter a channel name");
      return;
    }
    setShouldJoin(true);
  };

  const handleLeave = () => {
    setShouldJoin(false);
    setChannelName("");
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  if (!isConnected && !shouldJoin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Join Streaming Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="channel">Channel Name</Label>
            <Input
              id="channel"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Enter channel name"
            />
          </div>
          <div>
            <Label htmlFor="uid">User ID (Optional)</Label>
            <Input
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Enter user ID or leave empty"
            />
          </div>
          <Button 
            onClick={handleJoin} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Joining..." : "Join Channel"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Channel: {channelName}</h2>
        <div className="flex gap-2">
          <Button
            variant={videoEnabled ? "default" : "secondary"}
            size="sm"
            onClick={toggleVideo}
          >
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            variant={audioEnabled ? "default" : "secondary"}
            size="sm"
            onClick={toggleAudio}
          >
            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLeave}>
            <PhoneOff className="h-4 w-4" />
            Leave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Local video */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">You</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {localCameraTrack && videoEnabled ? (
                <div 
                  ref={(ref) => {
                    if (ref && localCameraTrack) {
                      localCameraTrack.play(ref);
                    }
                  }}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <VideoOff className="h-8 w-8" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Remote users */}
        {remoteUsers.map((user) => (
          <Card key={user.uid}>
            <CardHeader>
              <CardTitle className="text-sm">User {user.uid}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {user.videoTrack ? (
                  <div
                    ref={(ref) => {
                      if (ref && user.videoTrack) {
                        user.videoTrack.play(ref);
                      }
                    }}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <VideoOff className="h-8 w-8" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {remoteUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Waiting for other users to join...
        </div>
      )}
    </div>
  );
};

export default StreamingRoom;
