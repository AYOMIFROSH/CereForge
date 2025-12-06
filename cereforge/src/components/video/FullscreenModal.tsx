// src/components/video/FullscreenModal.tsx
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Participant } from '@/types/video.types';

interface FullscreenModalProps {
  participant: Participant;
  showScreenContent: boolean; // ✅ NEW: Tell modal what to display
  onClose: () => void;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({ 
  participant, 
  showScreenContent, 
  onClose 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // ✅ FIXED: Attach correct stream based on showScreenContent
  useEffect(() => {
    if (videoRef.current) {
      if (showScreenContent && participant.screenStream) {
        videoRef.current.srcObject = participant.screenStream;
      } else if (!showScreenContent && participant.mediaStream) {
        videoRef.current.srcObject = participant.mediaStream;
      }
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [participant.mediaStream, participant.screenStream, showScreenContent]);

  // ✅ FIXED: Determine if we should show video or avatar
  const shouldShowVideo = () => {
    if (showScreenContent) {
      return !!participant.screenStream;
    }
    return !participant.isCameraOff && !!participant.mediaStream;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full h-full flex items-center justify-center">
        {shouldShowVideo() ? (
          // ✅ FIXED: Show video element with correct stream
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={participant.isLocal && !showScreenContent}
            className={`w-full h-full ${
              showScreenContent ? 'object-contain' : 'object-cover'
            } ${
              participant.isLocal && !showScreenContent ? 'scale-x-[-1]' : ''
            }`}
          />
        ) : (
          // ✅ Show avatar when no video available
          <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
            {participant.name.charAt(0).toUpperCase()}
          </div>
        )}
      

        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 bg-red-500/100 backdrop-blur-sm hover:bg-red-600 rounded-full flex items-center justify-center transition-all shadow-lg"
          aria-label="Exit fullscreen"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default FullscreenModal;