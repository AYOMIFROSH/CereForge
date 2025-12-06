// src/components/video/RecordingIndicator.tsx
import React, { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';

interface RecordingIndicatorProps {
  isRecording: boolean;
  startTime?: Date;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ 
  isRecording, 
  startTime 
}) => {
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    if (!isRecording || !startTime) {
      setDuration('00:00');
      return;
    }

    const updateDuration = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setDuration(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  if (!isRecording) return null;

  return (
    <div className="absolute top-4 left-4 z-40 animate-in fade-in slide-in-from-left duration-300">
      <div className="bg-red-500 px-4 py-2 rounded-full flex items-center space-x-3 shadow-lg">
        <Circle className="w-3 h-3 text-white fill-white animate-pulse" />
        <div className="flex items-center space-x-2">
          <span className="text-white font-semibold">REC</span>
          <span className="text-white/90 font-mono text-sm">{duration}</span>
        </div>
      </div>
    </div>
  );
};

export default RecordingIndicator;