// src/hooks/useVideoSession.ts - UPDATED: No mock participants by default
import { useState, useCallback, useEffect } from 'react';
import { 
  Participant, 
  ChatMessage, 
  Reaction, 
  VideoSession, 
  PanelsState,
  VideoSettings 
} from '@/types/video.types';

// ✅ UPDATED: Create ONLY local participant (no mock participants)
const createLocalParticipant = (
  userId: string, 
  localStream?: MediaStream | null,
  screenStream?: MediaStream | null
): Participant => ({
  id: userId,
  name: 'You',
  isLocal: true,
  isMuted: false,
  isCameraOff: false,
  isSpeaking: false,
  isHandRaised: false,
  isSpectator: false,
  connectionQuality: 'excellent',
  joinedAt: new Date(),
  mediaStream: localStream || undefined,
  screenStream: screenStream || undefined
});

// ✅ OPTIONAL: Mock participants for testing (disabled by default)
const createMockParticipants = (
  userId: string, 
  localStream?: MediaStream | null,
  screenStream?: MediaStream | null
): Participant[] => [
  createLocalParticipant(userId, localStream, screenStream),
  {
    id: '2',
    name: 'John Doe',
    isLocal: false,
    isMuted: false,
    isCameraOff: true,
    isSpeaking: true,
    isHandRaised: false,
    isSpectator: false,
    connectionQuality: 'good',
    joinedAt: new Date()
  },
  {
    id: '3',
    name: 'Jane Smith',
    isLocal: false,
    isMuted: true,
    isCameraOff: true,
    isSpeaking: false,
    isHandRaised: false,
    isSpectator: false,
    connectionQuality: 'excellent',
    joinedAt: new Date()
  }
];

export const useVideoSession = (
  roomId: string, 
  userId: string, 
  localStream?: MediaStream | null,
  screenStream?: MediaStream | null,
  useMockParticipants: boolean = false // ✅ NEW: Default to false (no mock participants)
) => {
  const [session, setSession] = useState<VideoSession>({
    roomId,
    hostId: userId,
    participants: useMockParticipants 
      ? createMockParticipants(userId, localStream, screenStream)
      : [createLocalParticipant(userId, localStream, screenStream)], // ✅ Only local user by default
    isRecording: false,
    screenShareActive: false
  });

  const [panelsState, setPanelsState] = useState<PanelsState>({
    isChatOpen: false,
    isParticipantsOpen: false,
    isSettingsOpen: false,
    isReactionsOpen: false
  });

  const [settings, setSettings] = useState<VideoSettings>({
    videoQuality: 'medium',
    enableVirtualBackground: false,
    enableNoiseSuppression: true
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // ✅ Update local participant's streams when they change
  useEffect(() => {
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === userId 
          ? { 
              ...p, 
              mediaStream: localStream || undefined,
              screenStream: screenStream || undefined
            } 
          : p
      )
    }));
  }, [localStream, screenStream, userId]);

  // ✅ Update screen share active state
  useEffect(() => {
    setSession(prev => ({
      ...prev,
      screenShareActive: !!screenStream,
      screenShareUserId: screenStream ? userId : undefined
    }));
  }, [screenStream, userId]);

  // ✅ Sync local participant's device state from useMediaDevices
  const syncLocalParticipant = useCallback((deviceState: {
    isMuted?: boolean;
    isCameraOff?: boolean;
  }) => {
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === userId 
          ? { 
              ...p, 
              ...(deviceState.isMuted !== undefined && { isMuted: deviceState.isMuted }),
              ...(deviceState.isCameraOff !== undefined && { isCameraOff: deviceState.isCameraOff })
            } 
          : p
      )
    }));
  }, [userId]);

  // ✅ Get screen share info for UI controls
  const getScreenShareInfo = useCallback(() => {
    const sharingParticipant = session.participants.find(p => p.screenStream);
    return {
      isAnyoneSharing: session.screenShareActive,
      sharingUserId: session.screenShareUserId,
      sharingUserName: sharingParticipant?.name,
      canShare: !session.screenShareActive || session.screenShareUserId === userId
    };
  }, [session, userId]);

  // ✅ Recording controls
  const toggleRecording = useCallback(() => {
    setSession(prev => ({
      ...prev,
      isRecording: !prev.isRecording,
      recordingStartTime: !prev.isRecording ? new Date() : undefined
    }));
  }, []);

  // ✅ Hand raise controls
  const toggleHandRaise = useCallback(() => {
    setIsHandRaised(prev => !prev);
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === userId ? { ...p, isHandRaised: !p.isHandRaised } : p
      )
    }));
  }, [userId]);

  // ✅ Chat controls
  const sendMessage = useCallback((message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId,
      userName: 'You',
      message,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, newMessage]);
  }, [userId]);

  // ✅ Reaction controls
  const sendReaction = useCallback((emoji: string) => {
    const newReaction: Reaction = {
      id: Date.now().toString(),
      emoji,
      userId,
      userName: 'You',
      x: Math.random() * 80 + 10,
      y: Math.random() * 50 + 25,
      timestamp: new Date()
    };
    setReactions(prev => [...prev, newReaction]);
    
    const frame = requestAnimationFrame(() => {
      const timeout = setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
        clearTimeout(timeout);
      }, 3000);
      cancelAnimationFrame(frame);
    });
  }, [userId]);

  // ✅ Settings controls
  const updateSettings = useCallback((newSettings: VideoSettings) => {
    setSettings(newSettings);
  }, []);

  // ✅ Leave call
  const leaveCall = useCallback(() => {
    window.location.href = '/';
  }, []);

  return {
    session,
    panelsState,
    settings,
    messages,
    reactions,
    isHandRaised,
    
    syncLocalParticipant,
    toggleRecording,
    toggleHandRaise,
    sendMessage,
    sendReaction,
    updateSettings,
    setPanelsState,
    leaveCall,
    getScreenShareInfo
  };
};