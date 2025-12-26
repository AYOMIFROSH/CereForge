import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
// Import your other components (VideoOverview, Editor, etc.)
import VideoOverview from '@/components/video/VideoOverview';
import CereforgeEditor from '@/components/textEditor/RichtextEditor';
import CalendarPage from '../CalendarPage';
import Sidebar from '@/components/layouts/Sidebar';

type TabType = 'overview' | 'editor' | 'calendar' | 'video';

const CoreOverview = () => (
  <div className="p-6 space-y-6">
    <h2 className="text-3xl font-bold text-gray-900">Core Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Active Tasks</h3>
        <p className="text-gray-600">Tasks overview</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Projects</h3>
        <p className="text-gray-600">Project overview</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
        <p className="text-gray-600">Team overview</p>
      </div>
    </div>
  </div>
);


const CoreDashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  useDocumentTitle("Core Dashboard - Cereforge", "Core system dashboard", "/core/dashboard");
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
      case 'overview': return <CoreOverview />;
      case 'editor': return <CereforgeEditor />;
      case 'calendar': return <CalendarPage />;
      case 'video': return <VideoOverview />;
      default: return <CoreOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        isLoading={isLoading}
      />

      {/* Changed ml-20 to ml-16 to match w-16 sidebar */}
      <main className="flex-1 ml-16 transition-all duration-300">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default CoreDashboard;