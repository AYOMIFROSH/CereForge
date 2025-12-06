// src/components/video/VideoCallRoom.tsx - UPDATED: No mock participants
import React, { useRef, useState, useCallback, useEffect } from 'react';
import VideoGrid from './VideoGrid';
import VideoControls from './VideoControls';
import ChatPanel from './ChatPanel';
import ParticipantsList from './ParticipantList';
import SettingsPanel from './SettingsPanel';
import RecordingIndicator from './RecordingIndicator';
import ReactionsOverlay from './ReactionsOverlay';
import FullscreenModal from './FullscreenModal';
import { useVideoSession } from '@/hooks/useVideoSession';
import { useScreenMode } from '@/hooks/useScreenMode';
import { useMediaDevices } from '@/hooks/useMediaDevice';
import { Participant } from '@/types/video.types';

interface VideoCallRoomProps {
  roomId: string;
  userId: string;
}

const VideoCallRoom: React.FC<VideoCallRoomProps> = ({ roomId, userId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ SINGLE SOURCE OF TRUTH: useMediaDevices manages ALL device state
  const {
    localStream,
    screenStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    startCamera,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare
  } = useMediaDevices();

  // ✅ useVideoSession manages: participants, chat, recording, reactions (NO MOCK DATA)
  const {
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
    updateSettings,
    setPanelsState,
    leaveCall,
    getScreenShareInfo
  } = useVideoSession(roomId, userId, localStream, screenStream, false); // ✅ false = no mock participants

  const { isFullScreen, toggleFullScreen } = useScreenMode(containerRef);

  const [expandedParticipant, setExpandedParticipant] = useState<Participant | null>(null);
  const [expandedContentIsScreen, setExpandedContentIsScreen] = useState<boolean>(false);
  const [isFocusedLayout, setIsFocusedLayout] = useState(false);

  // ✅ Start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // ✅ CRITICAL: Sync device state to participant state (single direction)
  useEffect(() => {
    syncLocalParticipant({
      isMuted: !isMicOn,
      isCameraOff: !isCameraOn
    });
  }, [isMicOn, isCameraOn, syncLocalParticipant]);

  // ✅ SIMPLIFIED: Just toggle device (no duplicate state management)
  const handleToggleCamera = useCallback(async () => {
    await toggleCamera();
  }, [toggleCamera]);

  // ✅ SIMPLIFIED: Just toggle device (no duplicate state management)
  const handleToggleMute = useCallback(async () => {
    await toggleMicrophone();
  }, [toggleMicrophone]);

  // ✅ SIMPLIFIED: Just toggle screen share
  const handleToggleScreenShare = useCallback(() => {
    const shareInfo = getScreenShareInfo();
    
    if (shareInfo.canShare) {
      toggleScreenShare();
    }
  }, [toggleScreenShare, getScreenShareInfo]);

  const handleLeaveCall = useCallback(() => {
    if (confirm('Are you sure you want to leave this call?')) {
      leaveCall();
    }
  }, [leaveCall]);

  const handleReactionComplete = useCallback((_reactionId: string) => {
    // Reaction automatically removed by useVideoSession timeout
  }, []);

  const handleExpand = useCallback((participant: Participant, showScreenContent: boolean) => {
    setExpandedParticipant(participant);
    setExpandedContentIsScreen(showScreenContent);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedParticipant(null);
    setExpandedContentIsScreen(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 overflow-hidden ${
        isFullScreen ? 'h-screen' : 'h-[calc(100vh-1px)]'
      }`}
    >
      <RecordingIndicator
        isRecording={session.isRecording}
        startTime={session.isRecording ? session.recordingStartTime : undefined}
      />

      <VideoGrid
        participants={session.participants}
        screenShareActive={session.screenShareActive}
        screenShareUserId={session.screenShareUserId}
        onExpand={handleExpand}
        onFocusedLayoutChange={setIsFocusedLayout}
      />

      <ReactionsOverlay
        reactions={reactions}
        onReactionComplete={handleReactionComplete}
      />

      {/* ✅ CLEANED UP: Pass device state directly from useMediaDevices */}
      <VideoControls
        controlsState={{
          isMuted: !isMicOn,
          isCameraOff: !isCameraOn,
          isScreenSharing,
          isRecording: session.isRecording,
          isHandRaised
        }}
        isFullScreen={isFullScreen}
        isFocusedLayout={isFocusedLayout}
        screenShareInfo={getScreenShareInfo()}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleRecording={toggleRecording}
        onToggleHandRaise={toggleHandRaise}
        onToggleFullScreen={toggleFullScreen}
        onOpenChat={() => setPanelsState({
          ...panelsState,
          isChatOpen: !panelsState.isChatOpen,
          isParticipantsOpen: false
        })}
        onOpenParticipants={() => setPanelsState({
          ...panelsState,
          isParticipantsOpen: !panelsState.isParticipantsOpen,
          isChatOpen: false
        })}
        onOpenSettings={() => setPanelsState({
          ...panelsState,
          isSettingsOpen: true
        })}
        onOpenReactions={() => setPanelsState({
          ...panelsState,
          isReactionsOpen: !panelsState.isReactionsOpen
        })}
        onLeave={handleLeaveCall}
        roomId={roomId}
      />

      <ChatPanel
        isOpen={panelsState.isChatOpen}
        onClose={() => setPanelsState({ ...panelsState, isChatOpen: false })}
        messages={messages}
        onSendMessage={sendMessage}
      />

      <ParticipantsList
        isOpen={panelsState.isParticipantsOpen}
        onClose={() => setPanelsState({ ...panelsState, isParticipantsOpen: false })}
        participants={session.participants}
        hostId={session.hostId}
        currentUserId={userId}
      />

      <SettingsPanel
        isOpen={panelsState.isSettingsOpen}
        onClose={() => setPanelsState({ ...panelsState, isSettingsOpen: false })}
        settings={settings}
        onSaveSettings={updateSettings}
      />

      {expandedParticipant && (
        <FullscreenModal
          participant={expandedParticipant}
          showScreenContent={expandedContentIsScreen}
          onClose={handleCloseExpanded}
        />
      )}
    </div>
  );
};

export default VideoCallRoom;