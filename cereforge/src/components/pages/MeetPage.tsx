// src/pages/MeetPage.tsx - UPDATED: Guest access support
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import VideoCallRoom from '@/components/video/VideoCallRoom';
import GuestNameModal from '@/components/video/GuestNameModal';
import { useAppSelector } from '@/store/hook';

const MeetPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [guestName, setGuestName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  // Redirect to home if no room ID
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  // ✅ Authenticated users: Join directly
  if (isAuthenticated && user) {
    return (
      <div className="h-screen bg-gray-900 overflow-hidden">
        <VideoCallRoom 
          roomId={roomId}
          userId={user.id}
          userName={user.name}
          userRole={user.role}
          isGuest={false}
        />
      </div>
    );
  }

  // ✅ Guests: Show name entry modal first
  if (!hasJoined) {
    return (
      <GuestNameModal
        roomId={roomId}
        onJoin={(name) => {
          setGuestName(name);
          setHasJoined(true);
        }}
      />
    );
  }

  // ✅ Guest has entered name: Join as guest
  return (
    <div className="h-screen bg-gray-900 overflow-hidden">
      <VideoCallRoom 
        roomId={roomId}
        userId={`guest-${Date.now()}`}
        userName={guestName}
        userRole={undefined}
        isGuest={true}
      />
    </div>
  );
};

export default MeetPage;