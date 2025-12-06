// src/components/video/VideoGrid.tsx - FIXED: Smart sidebar logic for single user
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

    // ✅ FIXED: Sidebar only when there are OTHER participants to show
    // Single user scenarios:
    // - 1 person + screen share (no camera) → Full screen (no sidebar)
    // - 1 person + camera (no screen) → Grid layout (no sidebar)
    // - 1 person + screen + camera → Focus layout (sidebar: camera, main: screen)
    
    // Multiple user scenarios:
    // - 2+ people + screen share → Focus layout (sidebar: others, main: screen)
    // - 2+ people + multiple cameras → Focus layout (sidebar: others, main: speaker)

    const shouldUseFocusLayout = 
      (screenShareUser && count > 1) ||  // Screen share + other participants exist
      (cameraOnUsers.length > 1) ||     // Multiple cameras on
      (screenShareUser && !screenShareUser.isCameraOff && count === 1); // Single user: screen + camera both on

    if (!shouldUseFocusLayout) {
      // ✅ Grid layout for:
      // - Single user with camera only
      // - Single user with screen share only (no camera)
      // - Multiple users all cameras off
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

      // ✅ For single user with screen share only (no camera):
      // Show screen in grid layout (full screen, no sidebar)
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

    // ✅ Focus layout logic (sidebar + large view)
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
          // Main view: screen share
          // Sidebar: camera (if on)
          if (!screenShareUser.isCameraOff) {
            sidebar.push({ ...screenShareUser, __tileType: 'camera' } as any);
          }
        } else {
          // Main view: camera
          // Sidebar: screen share
          sidebar.push({ ...screenShareUser, __tileType: 'screen' } as any);
        }
      } else {
        // Someone else is focused
        // Sidebar: screen share + camera (if on)
        sidebar.push({ ...screenShareUser, __tileType: 'screen' } as any);
        if (!screenShareUser.isCameraOff) {
          sidebar.push({ ...screenShareUser, __tileType: 'camera' } as any);
        }
      }
    }
    
    // Add other participants to sidebar
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

  // ✅ Focused layout (sidebar + large view)
  if (hasFocusLayout && focusedParticipant) {
    return (
      <div className="h-full flex gap-3 p-4">
        {/* ✅ Only show sidebar if there are items to display */}
        {sidebarParticipants.length > 0 && (
          <div className="w-64 flex-shrink-0 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
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
        )}

        {/* Main focus view */}
        <div className="flex-1">
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
        </div>
      </div>
    );
  }

  // ✅ Grid layout (full width, no sidebar)
  // ✅ Special handling for single user screen share (full viewport)
  const isSingleScreenShare = 
    visibleParticipants.length === 1 && 
    (visibleParticipants[0] as any).__tileType === 'screen';

  return (
    <div className={`h-full p-4 overflow-y-auto ${
      isSingleScreenShare ? 'flex items-center justify-center' : ''
    }`}>
      <div className={`grid ${gridClass} gap-3 ${
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