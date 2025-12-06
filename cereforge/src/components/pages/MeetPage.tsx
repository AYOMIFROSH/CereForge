// src/pages/MeetPage.tsx
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import VideoCallRoom from '@/components/video/VideoCallRoom';
import { useAppSelector } from '@/store/hook';

const MeetPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: `/meet/${roomId}` }} replace />;
  }

  // Redirect to home if no room ID
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen bg-gray-900 overflow-hidden">
      <VideoCallRoom 
        roomId={roomId}
        userId={user.id}
      />
    </div>
  );
};

export default MeetPage;