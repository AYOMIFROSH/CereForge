// src/components/video/VideoGrid.tsx - ENHANCED: Smart spacing for floating controls
import React, { useMemo, useEffect, useState } from 'react';
import ParticipantTile from './ParticipantTile';
import { Participant, GridLayout } from '@/types/video.types';

interface VideoGridProps {
  participants: Participant[];
  screenShareActive: boolean;
  screenShareUserId?: string;
  onExpand: (participant: Participant, showScreenContent: boolean) => void;
  onFocusedLayoutChange?: (isFocused: boolean) => void;
}

type FocusType = 'screen' | 'camera';

const VideoGrid: React.FC<VideoGridProps> = ({ 
  participants, 
  screenShareActive,
  screenShareUserId,
  onExpand,
  onFocusedLayoutChange
}) => {
  const [manualFocusId, setManualFocusId] = useState<string | null>(null);
  const [manualFocusType, setManualFocusType] = useState<FocusType>('screen');

  const { 
    visibleParticipants, 
    focusedParticipant,
    focusedType,
    sidebarParticipants, 
    layout, 
    gridClass, 
    hasFocusLayout 
  } = useMemo(() => {
    const visible = participants.filter(p => !p.isSpectator);
    const count = visible.length;

    const screenShareUser = screenShareActive && screenShareUserId 
      ? visible.find(p => p.id === screenShareUserId) 
      : undefined;
    
    const cameraOnUsers = visible.filter(p => !p.isCameraOff);

    const shouldUseFocusLayout = 
      (screenShareUser && count > 1) ||
      (cameraOnUsers.length > 1) ||
      (screenShareUser && !screenShareUser.isCameraOff && count === 1);

    if (!shouldUseFocusLayout) {
      let layout: GridLayout;
      let gridClass: string;

      if (count === 1) {
        layout = 'grid-1';
        gridClass = 'grid-cols-1';
      } else if (count === 2) {
        layout = 'grid-2';
        gridClass = 'grid-cols-2';
      } else if (count <= 4) {
        layout = 'grid-4';
        gridClass = 'grid-cols-2';
      } else if (count <= 9) {
        layout = 'grid-9';
        gridClass = 'grid-cols-3';
      } else if (count <= 16) {
        layout = 'grid-16';
        gridClass = 'grid-cols-4';
      } else if (count <= 25) {
        layout = 'grid-25';
        gridClass = 'grid-cols-5';
      } else {
        layout = 'grid-many';
        gridClass = 'grid-cols-6';
      }

      const tilesToShow = screenShareUser && count === 1 && screenShareUser.isCameraOff
        ? [{ ...screenShareUser, __tileType: 'screen' } as any]
        : visible;

      return {
        visibleParticipants: tilesToShow,
        focusedParticipant: undefined,
        focusedType: 'camera' as FocusType,
        sidebarParticipants: [],
        layout,
        gridClass,
        hasFocusLayout: false
      };
    }

    let focused: Participant | undefined;
    let focusType: FocusType = 'screen';

    if (manualFocusId) {
      focused = visible.find(p => p.id === manualFocusId);
      focusType = manualFocusType;
      
      if (!focused) {
        setManualFocusId(null);
      }
    }

    if (!focused) {
      if (screenShareUser) {
        focused = screenShareUser;
        focusType = 'screen';
      } else if (cameraOnUsers.length > 0) {
        focused = cameraOnUsers[0];
        focusType = 'camera';
      }
    }

    let sidebar: Participant[] = [];
    
    if (screenShareUser && focused) {
      const isScreenShareUserFocused = focused.id === screenShareUser.id;
      
      if (isScreenShareUserFocused) {
        if (focusType === 'screen') {
          if (!screenShareUser.isCameraOff) {
            sidebar.push({ ...screenShareUser, __tileType: 'camera' } as any);
          }
        } else {
          sidebar.push({ ...screenShareUser, __tileType: 'screen' } as any);
        }
      } else {
        sidebar.push({ ...screenShareUser, __tileType: 'screen' } as any);
        if (!screenShareUser.isCameraOff) {
          sidebar.push({ ...screenShareUser, __tileType: 'camera' } as any);
        }
      }
    }
    
    const otherParticipants = visible.filter(p => 
      p.id !== focused?.id && p.id !== screenShareUser?.id
    );
    sidebar.push(...otherParticipants.map(p => ({ ...p, __tileType: 'camera' } as any)));

    return {
      visibleParticipants: visible,
      focusedParticipant: focused,
      focusedType: focusType,
      sidebarParticipants: sidebar,
      layout: 'grid-1' as GridLayout,
      gridClass: 'grid-cols-1',
      hasFocusLayout: true
    };
  }, [participants, screenShareActive, screenShareUserId, manualFocusId, manualFocusType]);

  useEffect(() => {
    if (manualFocusId) {
      const focusedUser = participants.find(p => p.id === manualFocusId);
      
      if (!focusedUser) {
        setManualFocusId(null);
        return;
      }

      if (manualFocusType === 'camera' && focusedUser.isCameraOff) {
        setManualFocusId(null);
      }

      if (manualFocusType === 'screen' && focusedUser.id !== screenShareUserId) {
        setManualFocusId(null);
      }
    }
  }, [participants, manualFocusId, manualFocusType, screenShareUserId]);

  useEffect(() => {
    if (onFocusedLayoutChange) {
      onFocusedLayoutChange(hasFocusLayout);
    }
  }, [hasFocusLayout, onFocusedLayoutChange]);

  const handleFocusChange = (participantId: string, type: FocusType) => {
    setManualFocusId(participantId);
    setManualFocusType(type);
  };

  // ✅ ENHANCED: Focused layout with smart spacing
  if (hasFocusLayout && focusedParticipant) {
    const hasSidebar = sidebarParticipants.length > 0;
    
    return (
      <div className={`h-full flex gap-4 transition-all duration-300 ${
        hasSidebar ? 'p-4 pb-24' : 'p-4 pb-6'
      }`}>
        {/* Sidebar with elegant styling */}
        {hasSidebar && (
          <div className="w-72 flex-shrink-0 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-600/50 scrollbar-track-transparent hover:scrollbar-thumb-gray-500/70 transition-all">
            <div className="space-y-3 pr-1">
              {sidebarParticipants.map((participant) => {
                const tileType = (participant as any).__tileType as FocusType;
                const showScreen = tileType === 'screen';
                const uniqueKey = `${participant.id}-${tileType}`;
                
                return (
                  <ParticipantTile
                    key={uniqueKey}
                    participant={participant}
                    layout="grid-many"
                    isScreenShare={showScreen}
                    showScreenContent={showScreen}
                    onExpand={() => onExpand(participant, showScreen)}
                    onFocus={() => handleFocusChange(participant.id, tileType)}
                    showFocusButton={true}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Main focus view - Enhanced with gradient overlay */}
        <div className="flex-1 relative overflow-hidden rounded-xl">
          <ParticipantTile
            participant={focusedParticipant}
            layout="grid-1"
            isFocused={true}
            isScreenShare={focusedType === 'screen'}
            showScreenContent={focusedType === 'screen'}
            onExpand={() => onExpand(focusedParticipant, focusedType === 'screen')}
            onFocus={() => {}}
            showFocusButton={false}
          />
          
          {/* ✅ UNIQUE: Elegant gradient spacer for floating controls */}
          {hasSidebar && (
            <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent backdrop-blur-[1px] transition-opacity duration-300" />
          )}
        </div>
      </div>
    );
  }

  // ✅ Grid layout (full width, no sidebar)
  const isSingleScreenShare = 
    visibleParticipants.length === 1 && 
    (visibleParticipants[0] as any).__tileType === 'screen';

  return (
    <div className={`h-full transition-all duration-300 ${
      isSingleScreenShare 
        ? 'p-4 pb-24 flex items-center justify-center' 
        : 'p-4 pb-6 overflow-y-auto'
    }`}>
      <div className={`grid ${gridClass} gap-4 ${
        isSingleScreenShare ? 'h-full w-full' : 'auto-rows-max'
      }`}>
        {visibleParticipants.map(participant => {
          const tileType = (participant as any).__tileType as FocusType | undefined;
          const showScreen = tileType === 'screen';
          
          return (
            <ParticipantTile
              key={showScreen ? `${participant.id}-screen` : participant.id}
              participant={participant}
              layout={layout}
              isScreenShare={showScreen}
              showScreenContent={showScreen}
              onExpand={() => onExpand(participant, showScreen)}
              onFocus={() => handleFocusChange(participant.id, showScreen ? 'screen' : 'camera')}
              showFocusButton={false}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VideoGrid;