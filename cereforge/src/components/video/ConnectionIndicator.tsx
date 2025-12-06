// src/components/video/ConnectionIndicator.tsx
import React from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';

interface ConnectionIndicatorProps {
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  showLabel?: boolean;
}

const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ 
  quality, 
  showLabel = false 
}) => {
  const getConfig = () => {
    switch (quality) {
      case 'excellent':
        return {
          icon: <Wifi className="w-5 h-5" />,
          color: 'text-green-500',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          label: 'Excellent',
          bars: 4
        };
      case 'good':
        return {
          icon: <Wifi className="w-5 h-5" />,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          label: 'Good',
          bars: 3
        };
      case 'poor':
        return {
          icon: <Signal className="w-5 h-5" />,
          color: 'text-orange-500',
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          label: 'Poor',
          bars: 2
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-5 h-5" />,
          color: 'text-red-500',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          label: 'Disconnected',
          bars: 0
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
      <div className={config.color}>
        {config.icon}
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default ConnectionIndicator;