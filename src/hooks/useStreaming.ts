'use client'

import { useCallback, useState } from 'react';
import { useRTCClient, useJoin, useLocalCameraTrack, useLocalMicrophoneTrack, usePublish, useRemoteUsers } from 'agora-rtc-react';

interface UseStreamingProps {
  appId: string;
  token?: string;
}

export const useStreaming = ({ appId, token }: UseStreamingProps) => {
  const [channelName, setChannelName] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [shouldJoin, setShouldJoin] = useState(false);

  const client = useRTCClient();
  const { localCameraTrack } = useLocalCameraTrack(isVideoEnabled);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isAudioEnabled);
  const { data: joinData, isLoading, isConnected, error } = useJoin({
    appid: appId,
    channel: channelName,
    token: token || null,
    uid: uid,
  }, shouldJoin && channelName !== '');

  const remoteUsers = useRemoteUsers();

  // Publish local tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  const joinChannel = useCallback((channel: string, userId?: string) => {
    setChannelName(channel);
    setUid(userId || null);
    setShouldJoin(true);
  }, []);

  const leaveChannel = useCallback(() => {
    setShouldJoin(false);
    setChannelName('');
    setUid(null);
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => !prev);
  }, []);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => !prev);
  }, []);

  return {
    // State
    channelName,
    uid,
    isVideoEnabled,
    isAudioEnabled,
    isLoading,
    isConnected,
    error,
    
    // Tracks
    localCameraTrack,
    localMicrophoneTrack,
    remoteUsers,
    
    // Actions
    joinChannel,
    leaveChannel,
    toggleVideo,
    toggleAudio,
    
    // Client
    client,
  };
};
