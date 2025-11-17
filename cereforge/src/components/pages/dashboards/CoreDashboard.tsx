import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, Mail, Briefcase } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const CoreDashboard = () => {
  useDocumentTitle(
    "Core Dashboard - Cereforge",
    "Core system dashboard",
    "/core/dashboard"
  );

  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-800 p-2 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Core Portal</h1>
                <p className="text-sm text-gray-600">Core system access</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-800" />
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-800" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{user?.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-blue-800" />
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
                You have successfully logged in as a <span className="font-semibold">Core Team Member</span>. 
                Your dashboard is ready to use.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content Placeholder */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tasks</h3>
            <p className="text-3xl font-bold text-blue-800">0</p>
            <p className="text-sm text-gray-600 mt-2">Active tasks</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Projects</h3>
            <p className="text-3xl font-bold text-blue-800">0</p>
            <p className="text-sm text-gray-600 mt-2">Ongoing projects</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Notifications</h3>
            <p className="text-3xl font-bold text-blue-800">0</p>
            <p className="text-sm text-gray-600 mt-2">Unread notifications</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoreDashboard;