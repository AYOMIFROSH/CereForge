import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { 
  LogOut, 
  LayoutDashboard, 
  Video, 
  FileEdit,
  Calendar as CalendarIcon,
  Menu,
  X
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDraggable } from '@/utils/useDraggable';
import VideoOverview from '@/components/video/VideoOverview';

type TabType = 'overview' | 'editor' | 'calendar' | 'video';

const AdminOverview = () => (
  <div className="p-6 space-y-6">
    <h2 className="text-3xl font-bold text-gray-900">Admin Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">System Stats</h3>
        <p className="text-gray-600">User statistics</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Analytics</h3>
        <p className="text-gray-600">System analytics</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Reports</h3>
        <p className="text-gray-600">System reports</p>
      </div>
    </div>
  </div>
);

const EditorComponent = () => (
  <div className="h-screen bg-white">
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Document Editor</h2>
      <p className="text-gray-600">Fullscreen editor component</p>
    </div>
  </div>
);

const CalendarComponent = () => (
  <div className="h-screen bg-white">
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Calendar</h2>
      <p className="text-gray-600">Fullscreen calendar component</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  useDocumentTitle(
    "Admin Dashboard - Cereforge",
    "Admin portal dashboard",
    "/admin/dashboard"
  );

  const [logoutApi, { isLoading }] = useLogoutMutation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isExpanded, setIsExpanded] = useState(false);

  const { position, isDragging, handleMouseDown, handleTouchStart } = useDraggable(
    window.innerWidth - 100,
    20
  );

  const shouldShowFullTabs = activeTab === 'overview';

  useEffect(() => {
    setIsExpanded(false);
  }, [activeTab]);

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

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'editor' as TabType, label: 'Editor', icon: FileEdit },
    { id: 'calendar' as TabType, label: 'Calendar', icon: CalendarIcon },
    { id: 'video' as TabType, label: 'Video', icon: Video },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'editor':
        return <EditorComponent />;
      case 'calendar':
        return <CalendarComponent />;
      case 'video':
        return <VideoOverview />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {shouldShowFullTabs && (
        <header className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center">
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-1 py-2 min-w-max">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                            isActive
                              ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg scale-105'
                              : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-shrink-0 pl-4 py-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {isLoading ? 'Logging out...' : 'Logout'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {!shouldShowFullTabs && (
        <div
          className="fixed z-50 animate-in fade-in zoom-in duration-200"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
        >
          <div className="relative">
            <button
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onClick={() => !isDragging && setIsExpanded(!isExpanded)}
              className={`bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-full p-3.5 shadow-2xl transition-all duration-200 ${
                isDragging ? 'scale-110' : 'hover:scale-110'
              }`}
              title={isExpanded ? "Close menu" : "Open menu"}
            >
              {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {isExpanded && (
              <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-3 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white scale-105'
                            : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className={shouldShowFullTabs ? 'pt-16' : 'pt-0'}>
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

export default AdminDashboard;