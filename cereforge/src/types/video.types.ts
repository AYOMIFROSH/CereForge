// src/types/video.types.ts

export interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
  isSpectator: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor';
  joinedAt: Date;
  mediaStream?: MediaStream; // Camera/mic stream
  screenStream?: MediaStream; // Screen share stream
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  x: number;
  y: number;
  timestamp: Date;
}

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

export interface VideoSession {
  roomId: string;
  hostId: string;
  participants: Participant[];
  isRecording: boolean;
  recordingStartTime?: Date;
  screenShareActive: boolean;
  screenShareUserId?: string;
  spotlightUserId?: string;
}

export interface ControlsState {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
}

export interface PanelsState {
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isSettingsOpen: boolean;
  isReactionsOpen: boolean;
}

export interface ScreenMode {
  isFullScreen: boolean;
  isMinimal: boolean;
}

export type GridLayout = 'grid-1' | 'grid-2' | 'grid-4' | 'grid-9' | 'grid-16' | 'grid-25' | 'grid-many';

export interface VideoSettings {
  selectedCamera?: string;
  selectedMicrophone?: string;
  selectedSpeaker?: string;
  videoQuality: 'low' | 'medium' | 'high';
  enableVirtualBackground: boolean;
  enableNoiseSuppression: boolean;
}