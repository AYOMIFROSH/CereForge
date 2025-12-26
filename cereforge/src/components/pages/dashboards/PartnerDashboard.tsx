import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
// Components
import VideoOverview from '@/components/video/VideoOverview';
import CalendarPage from '../CalendarPage';
import CereforgeEditor from '@/components/textEditor/RichtextEditor';
import ConsultationOverview from '@/components/consultation/ConsultationOverview';
import Sidebar from '@/components/layouts/Sidebar'; // Using the shared sidebar

type TabType = 'overview' | 'editor' | 'calendar' | 'video' | 'consultation';

const PartnerOverview = () => (
  <div className="p-6 space-y-6">
    <h2 className="text-3xl font-bold text-gray-900">Partner Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Recent Files</h3>
        <p className="text-gray-600">Files overview</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
        <p className="text-gray-600">Events overview</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Transcripts</h3>
        <p className="text-gray-600">Transcripts overview</p>
      </div>
    </div>
  </div>
);

const PartnerDashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  useDocumentTitle(
    "Partner Dashboard - Cereforge",
    "Partner portal dashboard",
    "/partner/dashboard"
  );

  const [logoutApi, { isLoading }] = useLogoutMutation();
  
  const tabFromURL = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(tabFromURL);

  useEffect(() => {
    if (activeTab !== tabFromURL) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, tabFromURL, setSearchParams]);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (error) {
      console.error('API logout failed:', error);
    } finally {
      dispatch(logout());
      window.location.href = '/login';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <PartnerOverview />;
      case 'editor': return <CereforgeEditor />;
      case 'calendar': return <CalendarPage />;
      case 'video': return <VideoOverview />;
      case 'consultation': return <ConsultationOverview />;
      default: return <PartnerOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex">
      {/* Shared Slim Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        handleLogout={handleLogout}
        isLoading={isLoading}
      />

      {/* Main Content Area - ml-16 to match the 64px sidebar */}
      <main className="flex-1 ml-16 transition-all duration-300">
        <div 
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          key={activeTab}
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;