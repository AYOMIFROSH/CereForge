// src/components/video/GuestNameModal.tsx
import React, { useState } from 'react';
import { User, Video } from 'lucide-react';

interface GuestNameModalProps {
  onJoin: (name: string) => void;
  roomId: string;
}

const GuestNameModal: React.FC<GuestNameModalProps> = ({ onJoin, roomId }) => {
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = guestName.trim();
    
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('Name must be less than 50 characters');
      return;
    }
    
    onJoin(trimmedName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Video Call</h2>
          <p className="text-gray-600 text-sm">Room: <span className="font-semibold">{roomId}</span></p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setError('');
                }}
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
                maxLength={50}
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> You're joining as a guest. 
              The host can see your name and admit you to the call.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Video className="w-5 h-5" />
              <span>Join Call</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestNameModal;