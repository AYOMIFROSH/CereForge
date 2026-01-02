// src/components/partners/PartnerOverview.tsx

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, FileText, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Partner Management <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </h2>
            <p className="text-sm text-gray-500 max-w-md">
              Manage incoming applications and oversee your active partner ecosystem from a single command center.
            </p>
          </div>

          {/* Modern Segmented Control */}
          <div className="bg-white p-1.5 rounded-xl border border-gray-200/60 shadow-sm flex items-center font-medium text-sm">
            <button
              onClick={() => setActiveTab('applications')}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
                activeTab === 'applications' 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeTab === 'applications' && (
                <motion.div
                  layoutId="activePartnerTabBg"
                  className="absolute inset-0 bg-blue-50/50 rounded-lg border border-blue-100"
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
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
                activeTab === 'partners' 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeTab === 'partners' && (
                <motion.div
                  layoutId="activePartnerTabBg"
                  className="absolute inset-0 bg-blue-50/50 rounded-lg border border-blue-100"
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

        {/* Content Area */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-200/40 overflow-hidden min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'applications' ? (
                <PartnerApplicationsList />
              ) : (
                <PartnersList />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PartnerOverview;