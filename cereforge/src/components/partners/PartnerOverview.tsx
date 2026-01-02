import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PartnerApplicationsList from './tabs/PartnerApplicationsList';
import PartnersList from './tabs/PartnersList';

type PartnerTab = 'applications' | 'partners';

const PartnerOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabFromURL = (searchParams.get('partner-tab') as PartnerTab) || 'applications';
  const [activeTab, setActiveTab] = useState<PartnerTab>(tabFromURL);

  // Sync state with URL
  useEffect(() => {
    const currentTab = searchParams.get('partner-tab');
    
    if (activeTab !== currentTab) {
      const params: Record<string, string> = { 
        tab: 'partners', 
        'partner-tab': activeTab 
      };
      
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-[600px]">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Partner Management</h2>
          <p className="text-sm text-gray-500">Review applications and manage partners</p>
        </div>

        {/* Modern Segmented Control */}
        <div className="bg-gray-100/80 p-1 rounded-xl flex items-center font-medium text-sm">
          <button
            onClick={() => setActiveTab('applications')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'applications' 
                ? 'text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {activeTab === 'applications' && (
              <motion.div
                layoutId="activePartnerTabBg"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Applications</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'partners' 
                ? 'text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {activeTab === 'partners' && (
              <motion.div
                layoutId="activePartnerTabBg"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Partners</span>
            </span>
          </button>
        </div>
      </div>

      {/* Content Area with Fade Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'applications' ? (
            <PartnerApplicationsList />
          ) : (
            <PartnersList />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PartnerOverview;