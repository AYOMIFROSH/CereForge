// src/components/video/VideoControls.tsx
import React, { useState } from 'react';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff,
  MessageSquare, Users, Settings, Hand, Smile, 
  Copy, MoreVertical
} from 'lucide-react';

interface ControlsState {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
}

interface VideoControlsProps {
  controlsState: ControlsState;
  isFullScreen: boolean;
  isFocusedLayout: boolean;
  screenShareInfo: {
    isAnyoneSharing: boolean;
    sharingUserId?: string;
    sharingUserName?: string;
    canShare: boolean;
  };
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleHandRaise: () => void;
  onToggleFullScreen: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  onOpenSettings: () => void;
  onOpenReactions: () => void;
  onLeave: () => void;
  roomId: string;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  controlsState,
  isFocusedLayout,
  screenShareInfo,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRecording,
  onToggleHandRaise,
  onOpenChat,
  onOpenParticipants,
  onOpenSettings,
  onOpenReactions,
  onLeave,
  roomId,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showScreenShareTooltip, setShowScreenShareTooltip] = useState(false);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${roomId}`);
    setCopied(true);
    const frame = requestAnimationFrame(() => {
      const timeout = requestAnimationFrame(() => {
        setCopied(false);
        cancelAnimationFrame(timeout);
      });
      cancelAnimationFrame(frame);
    });
  };

  const getPositionClass = () => {
  if (isFocusedLayout) {
    return 'left-[calc(50%+144px)]'; // Adjusted for wider sidebar
  }
  return 'left-1/2';
};

  const handleScreenShareClick = () => {
    if (screenShareInfo.canShare) {
      onToggleScreenShare();
    }
  };

  return (
    <div
      className={`absolute bottom-6 ${getPositionClass()} -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom duration-100 transition-all`}
    >
      <div className="relative px-8 py-2 rounded-full shadow-2xl border border-white/20 backdrop-blur-md bg-blue-900/40">
        <div className="flex items-center space-x-2">
          {/* Left: Room Info */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex-shrink-0">
              <span className="text-white text-sm font-medium whitespace-nowrap">Room: {roomId}</span>
            </div>
            <button
              onClick={copyRoomLink}
              className="bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/20 transition-all border border-white/20 relative"
              aria-label="Copy room link"
            >
              <Copy className="w-5 h-5 text-white" />
              {copied && (
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
                  Copied!
                </span>
              )}
            </button>
          </div>

          {/* Center: Main Controls */}
          <div className="flex items-center space-x-2">
            {/* Mute/Unmute */}
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-full transition-all shadow-lg ${
                controlsState.isMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20'
              }`}
              aria-label={controlsState.isMuted ? 'Unmute' : 'Mute'}
            >
              {controlsState.isMuted ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Camera On/Off */}
            <button
              onClick={onToggleCamera}
              className={`p-3 rounded-full transition-all shadow-lg ${
                controlsState.isCameraOff
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20'
              }`}
              aria-label={controlsState.isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {controlsState.isCameraOff ? (
                <VideoOff className="w-5 h-5 text-white" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Screen Share with Tooltip */}
            <div className="relative">
              <button
                onClick={handleScreenShareClick}
                onMouseEnter={() => !screenShareInfo.canShare && setShowScreenShareTooltip(true)}
                onMouseLeave={() => setShowScreenShareTooltip(false)}
                disabled={!screenShareInfo.canShare}
                className={`p-3 rounded-full transition-all shadow-lg ${
                  !screenShareInfo.canShare
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : controlsState.isScreenSharing
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20'
                }`}
                aria-label={controlsState.isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                {controlsState.isScreenSharing ? (
                  <MonitorOff className="w-5 h-5 text-white" />
                ) : (
                  <Monitor className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Tooltip when someone else is sharing */}
              {showScreenShareTooltip && !screenShareInfo.canShare && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap border border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {screenShareInfo.sharingUserName} is currently sharing
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              )}
            </div>

            {/* Leave Call */}
            <button
              onClick={onLeave}
              className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-lg ml-2"
              aria-label="Leave call"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Right: Additional Controls */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onOpenChat}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
              aria-label="Open chat"
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={onOpenParticipants}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
              aria-label="View participants"
            >
              <Users className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={onOpenReactions}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
              aria-label="Send reaction"
            >
              <Smile className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={onToggleHandRaise}
              className={`p-2 rounded-full transition-all shadow-lg ${
                controlsState.isHandRaised
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20'
              }`}
              aria-label={controlsState.isHandRaised ? 'Lower hand' : 'Raise hand'}
            >
              <Hand className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={onToggleRecording}
              className={`p-2 rounded-full transition-all ${
                controlsState.isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20'
              }`}
              aria-label={controlsState.isRecording ? 'Stop recording' : 'Start recording'}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  controlsState.isRecording ? 'bg-white' : 'bg-white/50 border-2 border-white'
                }`}
              />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMore(!showMore)}
                className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4 text-white" />
              </button>

              {showMore && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 py-2 min-w-[160px]">
                  <button className="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors text-sm">
                    View in grid
                  </button>
                  <button className="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors text-sm">
                    Report issue
                  </button>
                  <button className="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors text-sm">
                    Keyboard shortcuts
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;