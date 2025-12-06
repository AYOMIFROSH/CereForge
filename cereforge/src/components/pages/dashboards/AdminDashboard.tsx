import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { logout } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { User, Mail, Shield, LogOut, Video, LayoutDashboard, Users, Settings } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import VideoOverview from '@/components/video/VideoOverview';

type TabType = 'overview' | 'video' | 'users' | 'settings';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  useDocumentTitle(
    "Admin Dashboard - Cereforge",
    "Admin portal dashboard",
    "/admin/dashboard"
  );

  const { user } = useSelector((state: RootState) => state.auth);
  const [logoutApi, { isLoading }] = useLogoutMutation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      console.log('API logout successful');
    } catch (error) {
      console.error('API logout failed:', error);
    } finally {
      dispatch(logout());
      window.location.href = '/login';
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'video' as TabType, label: 'Video', icon: Video },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                <p className="text-sm text-gray-600">Administrative access - {user?.name || 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* User Info Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-semibold text-gray-900 capitalize">{user?.role || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-green-800">Authentication Successful!</h3>
                    <p className="text-green-700 mt-1">
                      You have successfully logged in as an <span className="font-semibold">Admin</span>. 
                      Your dashboard is ready to use.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dashboard Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Users</h3>
                  <p className="text-3xl font-bold text-gray-600">0</p>
                  <p className="text-sm text-gray-600 mt-2">Total users</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Applications</h3>
                  <p className="text-3xl font-bold text-gray-600">0</p>
                  <p className="text-sm text-gray-600 mt-2">Pending applications</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Reports</h3>
                  <p className="text-3xl font-bold text-gray-600">0</p>
                  <p className="text-sm text-gray-600 mt-2">System reports</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'video' && <VideoOverview />}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
              <p className="text-gray-600">User list and management tools will appear here.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">System Settings</h2>
              <p className="text-gray-600">Configure system settings here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;