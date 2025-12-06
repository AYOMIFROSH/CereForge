// src/hooks/video/useParticipantGrid.ts
import { useMemo } from 'react';
import { Participant, GridLayout } from '@/types/video.types';

interface GridConfig {
  layout: GridLayout;
  gridClass: string;
  columns: number;
  rows: number;
}

export const useParticipantGrid = (
  participants: Participant[],
  screenShareActive: boolean
): GridConfig => {
  return useMemo(() => {
    const count = participants.length;

    if (screenShareActive) {
      return {
        layout: 'grid-many',
        gridClass: 'grid-cols-6',
        columns: 6,
        rows: 1
      };
    }

    if (count === 1) {
      return {
        layout: 'grid-1',
        gridClass: 'grid-cols-1',
        columns: 1,
        rows: 1
      };
    }

    if (count === 2) {
      return {
        layout: 'grid-2',
        gridClass: 'grid-cols-2',
        columns: 2,
        rows: 1
      };
    }

    if (count <= 4) {
      return {
        layout: 'grid-4',
        gridClass: 'grid-cols-2',
        columns: 2,
        rows: 2
      };
    }

    if (count <= 9) {
      return {
        layout: 'grid-9',
        gridClass: 'grid-cols-3',
        columns: 3,
        rows: 3
      };
    }

    if (count <= 16) {
      return {
        layout: 'grid-16',
        gridClass: 'grid-cols-4',
        columns: 4,
        rows: 4
      };
    }

    if (count <= 25) {
      return {
        layout: 'grid-25',
        gridClass: 'grid-cols-5',
        columns: 5,
        rows: 5
      };
    }

    // For 26-150 participants
    return {
      layout: 'grid-many',
      gridClass: 'grid-cols-6',
      columns: 6,
      rows: Math.ceil(count / 6)
    };
  }, [participants.length, screenShareActive]);
};