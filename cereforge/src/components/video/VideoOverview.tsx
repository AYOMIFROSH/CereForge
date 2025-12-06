import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, LogIn,  Check, X } from 'lucide-react';

// ✅ Generate meeting ID (word-number-word format)
const generateMeetingId = (): string => {
  const words = ['blue', 'red', 'green', 'tiger', 'eagle', 'lion', 'wolf', 'bear', 'swift', 'brave'];
  const randomWord1 = words[Math.floor(Math.random() * words.length)];
  const randomWord2 = words[Math.floor(Math.random() * words.length)];
  const randomNumber = Math.floor(100 + Math.random() * 900); // 3-digit number
  
  return `${randomWord1}-${randomNumber}-${randomWord2}`;
};

const VideoOverview = () => {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // ✅ Start instant meeting
  const handleInstantMeeting = () => {
    const meetingId = generateMeetingId();
    const shareableLink = `${window.location.origin}/meet/${meetingId}`;
    
    // Copy link to clipboard
    navigator.clipboard.writeText(shareableLink);
    setCopiedLink(true);
    
    const frame = requestAnimationFrame(() => {
      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
      cancelAnimationFrame(frame);
    });
    
    // Navigate to meeting room
    navigate(`/meet/${meetingId}`);
  };

  // ✅ Join meeting via ID/link
  const handleJoinMeeting = () => {
    if (!meetingIdInput.trim()) return;
    
    // Extract meeting ID from link if full URL is pasted
    let meetingId = meetingIdInput.trim();
    
    // If it's a full URL, extract the meeting ID
    if (meetingId.includes('/meet/')) {
      const parts = meetingId.split('/meet/');
      meetingId = parts[parts.length - 1];
    }
    
    // Navigate to meeting
    navigate(`/meet/${meetingId}`);
    setShowJoinModal(false);
    setMeetingIdInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Meetings</h2>
        <p className="text-gray-600">Start or join secure video calls with your team</p>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Instant Meeting */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
             onClick={handleInstantMeeting}>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Meeting</h3>
              <p className="text-sm text-gray-600">Start a meeting right now and share the link</p>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
              <Video className="w-5 h-5" />
              <span>Start Now</span>
            </button>
          </div>
        </div>

        {/* Card 2: Schedule for Later */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
             onClick={() => navigate('/calendar')}>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Later</h3>
              <p className="text-sm text-gray-600">Quick schedule for a specific time</p>
            </div>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Schedule</span>
            </button>
          </div>
        </div>

        {/* Card 3: Schedule in Calendar */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
             onClick={() => navigate('/calendar')}>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Calendar</h3>
              <p className="text-sm text-gray-600">Full calendar integration with reminders</p>
            </div>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Open Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Join Meeting Section */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Join a Meeting</h3>
            <p className="text-sm text-gray-600">Enter meeting ID or paste invitation link</p>
          </div>
          <button 
            onClick={() => setShowJoinModal(true)}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <LogIn className="w-5 h-5" />
            <span>Join</span>
          </button>
        </div>
      </div>

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Join Meeting</h3>
              <button 
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting ID or Link
                </label>
                <input
                  type="text"
                  value={meetingIdInput}
                  onChange={(e) => setMeetingIdInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinMeeting()}
                  placeholder="e.g., blue-847-tiger or paste link"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>

              <button
                onClick={handleJoinMeeting}
                disabled={!meetingIdInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Join Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copied Link Toast */}
      {copiedLink && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-bottom duration-300">
          <Check className="w-5 h-5" />
          <span>Meeting link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
};

export default VideoOverview;