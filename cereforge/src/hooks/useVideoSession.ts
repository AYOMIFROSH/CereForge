// src/hooks/useVideoSession.ts - CLEANED: Removed unused mock parameter

import { useState, useCallback, useEffect } from 'react';
import { 
  Participant, 
  ChatMessage, 
  Reaction, 
  VideoSession, 
  PanelsState,
  VideoSettings 
} from '@/types/video.types';

// Create participant (works for both authenticated users and guests)
const createLocalParticipant = (
  userId: string,
  userName: string,
  isGuest: boolean,
  localStream?: MediaStream | null,
  screenStream?: MediaStream | null
): Participant => ({
  id: userId,
  name: userName || 'Guest',
  isLocal: true,
  isMuted: false,
  isCameraOff: false,
  isSpeaking: false,
  isHandRaised: false,
  isSpectator: false,
  connectionQuality: 'excellent',
  joinedAt: new Date(),
  mediaStream: localStream || undefined,
  screenStream: screenStream || undefined,
  isGuest
});

// ✅ CLEANED: Removed useMockParticipants parameter
export const useVideoSession = (
  roomId: string, 
  userId: string,
  userName: string,
  localStream?: MediaStream | null,
  screenStream?: MediaStream | null,
  userRole?: 'core' | 'admin' | 'partner',
  isGuest: boolean = false
) => {
  const [session, setSession] = useState<VideoSession>({
    roomId,
    hostId: userId,
    participants: [createLocalParticipant(userId, userName, isGuest, localStream, screenStream)],
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

  // Update local participant's streams when they change
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

  // Update screen share active state
  useEffect(() => {
    setSession(prev => ({
      ...prev,
      screenShareActive: !!screenStream,
      screenShareUserId: screenStream ? userId : undefined
    }));
  }, [screenStream, userId]);

  // Sync local participant's device state
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

  // Get screen share info
  const getScreenShareInfo = useCallback(() => {
    const sharingParticipant = session.participants.find(p => p.screenStream);
    return {
      isAnyoneSharing: session.screenShareActive,
      sharingUserId: session.screenShareUserId,
      sharingUserName: sharingParticipant?.name,
      canShare: !session.screenShareActive || session.screenShareUserId === userId
    };
  }, [session, userId]);

  // Recording controls
  const toggleRecording = useCallback(() => {
    setSession(prev => ({
      ...prev,
      isRecording: !prev.isRecording,
      recordingStartTime: !prev.isRecording ? new Date() : undefined
    }));
  }, []);

  // Hand raise controls
  const toggleHandRaise = useCallback(() => {
    setIsHandRaised(prev => !prev);
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === userId ? { ...p, isHandRaised: !p.isHandRaised } : p
      )
    }));
  }, [userId]);

  // Chat controls
  const sendMessage = useCallback((message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId,
      userName: isGuest ? `${userName} (Guest)` : userName,
      message,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, newMessage]);
  }, [userId, userName, isGuest]);

  // Reaction controls
  const sendReaction = useCallback((emoji: string) => {
    const newReaction: Reaction = {
      id: Date.now().toString(),
      emoji,
      userId,
      userName,
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
  }, [userId, userName]);

  // Settings controls
  const updateSettings = useCallback((newSettings: VideoSettings) => {
    setSettings(newSettings);
  }, []);

  // Smart leave navigation
  const leaveCall = useCallback(() => {
    // Clean up streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    
    // Navigate based on user type
    if (isGuest) {
      window.location.href = '/';
    } else if (userRole) {
      const dashboardPaths = {
        admin: '/admin/dashboard?tab=video',
        core: '/core/dashboard?tab=video',
        partner: '/partner/dashboard?tab=video'
      };
      window.location.href = dashboardPaths[userRole] || '/';
    } else {
      window.location.href = '/';
    }
  }, [localStream, screenStream, isGuest, userRole]);

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