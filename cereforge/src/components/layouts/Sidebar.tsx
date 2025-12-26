import { useState } from 'react';
import { 
  LogOut, 
  LayoutDashboard, 
  Video, 
  FileEdit, 
  Calendar as CalendarIcon,
  CalendarCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  handleLogout: () => void;
  isLoading: boolean;
}

const Sidebar = ({ activeTab, setActiveTab, handleLogout, isLoading }: SidebarProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Helper to handle click and force collapse
  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsHovered(false); // Forces the menu to snap shut immediately
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'editor', label: 'Editor', icon: FileEdit },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'consultation', label: 'Consultation', icon: CalendarCheck },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-xl z-50 transition-all duration-300 ease-in-out flex flex-col ${
        isHovered ? 'w-64' : 'w-16' // Slim 64px width
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100 overflow-hidden shrink-0 relative">
        {isHovered ? (
           <span className="text-xl font-bold text-blue-900 px-6 animate-in fade-in duration-200 whitespace-nowrap">
             CERE<span className="text-blue-600">FORGE</span>
           </span>
        ) : (
           <span className="text-lg font-bold text-blue-600">CF</span>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => handleTabClick(tab.id)} // Uses the new handler
                className={`flex items-center w-full h-10 px-2 rounded-lg transition-all duration-200 relative z-10 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {/* Icon - Perfectly centered */}
                <div className="w-8 flex justify-center shrink-0">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                </div>

                {/* Label - Visible on hover */}
                <span 
                  className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                  }`}
                >
                  {tab.label}
                </span>
              </button>

              {/* Tooltip (Only shows when NOT hovered/expanded) */}
              {!isHovered && (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                  {tab.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-2 border-t border-gray-100 shrink-0">
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`flex items-center w-full h-10 px-2 rounded-lg transition-all duration-200 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
          }`}
        >
          <div className="w-8 flex justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <span 
            className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
              isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;