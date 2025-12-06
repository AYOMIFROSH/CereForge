// src/components/video/ParticipantsList.tsx
import React, { useState } from 'react';
import { X, MicOff, VideoOff, Hand, MoreVertical, Crown, Search } from 'lucide-react';
import { Participant } from '@/types/video.types';

interface ParticipantsListProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  hostId?: string;
  currentUserId: string;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  isOpen,
  onClose,
  participants,
  hostId,
  currentUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-gray-900 shadow-2xl border-l border-gray-700 flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold text-lg">Participants</h3>
            <p className="text-gray-400 text-xs">{participants.length} in call</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
            aria-label="Close participants list"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {filteredParticipants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No participants found</p>
          </div>
        ) : (
          filteredParticipants.map((participant) => {
            const isHost = participant.id === hostId;
            const isCurrentUser = participant.id === currentUserId;

            return (
              <div
                key={participant.id}
                className="bg-gray-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-750 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Speaking Indicator Ring */}
                    {participant.isSpeaking && (
                      <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-pulse" />
                    )}
                  </div>

                  {/* Name & Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium truncate">
                        {participant.name}
                      </p>
                      {isHost && (
                        <div title="Host">
                          <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 mt-0.5">
                      {isCurrentUser && (
                        <span className="text-gray-400 text-xs">(You)</span>
                      )}
                      {participant.isHandRaised && (
                        <span className="text-yellow-500 text-xs flex items-center">
                          <Hand className="w-3 h-3 mr-1" />
                          Hand raised
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {participant.isMuted && (
                    <div className="p-1 bg-red-500 rounded">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {participant.isCameraOff && (
                    <div className="p-1 bg-gray-600 rounded">
                      <VideoOff className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* More Options (visible on hover, only for host) */}
                  {hostId === currentUserId && !isCurrentUser && (
                    <button
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions (Host Only) */}
      {hostId === currentUserId && (
        <div className="p-4 border-t border-gray-700 bg-gray-800 space-y-2">
          <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm font-medium transition-colors">
            Mute All
          </button>
          <button className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 py-2 rounded-lg text-sm font-medium transition-colors">
            Lower All Hands
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;