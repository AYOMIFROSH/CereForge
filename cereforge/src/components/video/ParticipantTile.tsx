// src/components/video/ParticipantTile.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MicOff, VideoOff, Wifi, WifiOff, Hand, Maximize2, Eye, Focus } from 'lucide-react';
import { Participant, GridLayout } from '@/types/video.types';

interface ParticipantTileProps {
  participant: Participant;
  layout: GridLayout;
  isScreenShare?: boolean;
  showScreenContent?: boolean;
  isFocused?: boolean;
  onExpand: () => void;
  onFocus: () => void;
  showFocusButton?: boolean;
}

const ParticipantTile: React.FC<ParticipantTileProps> = ({ 
  participant, 
  layout,
  isScreenShare = false,
  showScreenContent = false,
  isFocused = false,
  onExpand,
  onFocus,
  showFocusButton = false
}) => {
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach media stream to video element
  useEffect(() => {
    if (videoRef.current) {
      if (showScreenContent && participant.screenStream) {
        videoRef.current.srcObject = participant.screenStream;
      } else if (participant.mediaStream) {
        videoRef.current.srcObject = participant.mediaStream;
      }
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [participant.mediaStream, participant.screenStream, showScreenContent]);

  // Add this to ParticipantTile.tsx getTileSize() function (around line 40)

const getTileSize = () => {
  if (isFocused) return 'h-full';
  
  // ✅ NEW: Special case for single user screen share (full viewport)
  if (isScreenShare && layout === 'grid-1') {
    return 'h-[calc(100vh-8rem)]'; // Full viewport minus padding/controls
  }
  
  if (isScreenShare) return 'h-[120px]';
  
  switch (layout) {
    case 'grid-1':
      return 'h-[500px]';
    case 'grid-2':
    case 'grid-4':
      return 'h-[280px]';
    case 'grid-9':
      return 'h-[200px]';
    case 'grid-16':
      return 'h-[180px]';
    case 'grid-25':
      return 'h-[150px]';
    default:
      return 'h-[160px]';
  }
};

  const getConnectionIcon = () => {
    switch (participant.connectionQuality) {
      case 'excellent':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'good':
        return <Wifi className="w-5 h-5 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="w-5 h-5 text-red-500" />;
    }
  };

  const shouldShowVideo = () => {
    if (showScreenContent) {
      return !!participant.screenStream;
    }
    return !participant.isCameraOff && !!participant.mediaStream;
  };

  return (
    <div 
      className={`relative ${getTileSize()} bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${
        isFocused 
          ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/50' 
          : participant.isSpeaking 
            ? 'border-2 border-green-500 shadow-lg shadow-green-500/50 scale-[1.02]' 
            : 'border-2 border-gray-700'
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Stream or Avatar */}
      {shouldShowVideo() ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal && !showScreenContent}
          className={`absolute inset-0 w-full h-full ${
            showScreenContent ? 'object-contain' : 'object-cover'
          } ${
            participant.isLocal && !showScreenContent ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {participant.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Hover Controls Overlay */}
      {showControls && !isFocused && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center space-x-3 z-20 animate-in fade-in duration-200">
          {/* Expand Button */}
          <button
            onClick={onExpand}
            className="w-10 h-10 bg-blue-600/90 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all shadow-lg"
            aria-label="Expand to fullscreen"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>

          {/* Focus Button */}
          {showFocusButton && (
            <button
              onClick={onFocus}
              className="w-10 h-10 bg-orange-600/90 hover:bg-orange-700 rounded-full flex items-center justify-center transition-all shadow-lg"
              aria-label="Focus on this participant"
            >
              <Focus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Screen Share Badge */}
      {showScreenContent && (
        <div className="absolute top-2 left-2 bg-blue-600 px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 z-10">
          <Maximize2 className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">Screen</span>
        </div>
      )}

      {/* Name Badge */}
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
        <span className="text-white text-sm font-medium">
          {participant.name}
          {participant.isLocal && ' (You)'}
        </span>
      </div>

      {/* Muted Indicator */}
      {participant.isMuted && !showScreenContent && (
        <div className="absolute top-2 left-2 bg-red-500 p-1.5 rounded-full shadow-lg z-10">
          <MicOff className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Camera Off Indicator */}
      {participant.isCameraOff && !participant.isMuted && !showScreenContent && (
        <div className="absolute top-2 left-2 bg-gray-700 p-1.5 rounded-full shadow-lg z-10">
          <VideoOff className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Hand Raised Indicator */}
      {participant.isHandRaised && (
        <div className="absolute top-2 right-12 bg-yellow-500 p-1.5 rounded-full shadow-lg animate-bounce z-10">
          <Hand className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Spectator Badge */}
      {participant.isSpectator && (
        <div className="absolute top-2 right-2 bg-purple-500/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg flex items-center space-x-1 z-10">
          <Eye className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">Spectator</span>
        </div>
      )}

      {/* Connection Quality */}
      {!showScreenContent && (
        <div className="absolute top-2 right-2 z-10">
          {getConnectionIcon()}
        </div>
      )}

      {/* Speaking Indicator Animation */}
      {participant.isSpeaking && !showScreenContent && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default ParticipantTile;