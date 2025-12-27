import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutList, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConsultationList from './ConsultationList';
import CreateConsultation from './CreateConsultation';

type ConsultationTab = 'my-consultations' | 'create-new';

const ConsultationOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabFromURL = (searchParams.get('consultation-tab') as ConsultationTab) || 'my-consultations';
  const editingIdFromURL = searchParams.get('editing');
  
  const [activeTab, setActiveTab] = useState<ConsultationTab>(tabFromURL);
  const [editingConsultation, setEditingConsultation] = useState<string | null>(editingIdFromURL);

  // Sync state with URL
  useEffect(() => {
    const currentTab = searchParams.get('consultation-tab');
    const currentEditing = searchParams.get('editing');
    
    if (activeTab !== currentTab || editingConsultation !== currentEditing) {
      const params: Record<string, string> = { 
        tab: 'consultation', 
        'consultation-tab': activeTab 
      };
      
      if (editingConsultation) {
        params.editing = editingConsultation;
      }
      
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, editingConsultation, searchParams, setSearchParams]);

  const handleEdit = (consultationId: string) => {
    setEditingConsultation(consultationId);
    setActiveTab('create-new');
  };

  const handleCreateNew = () => {
    setEditingConsultation(null);
    setActiveTab('create-new');
  };

  const handleBackToList = () => {
    setEditingConsultation(null);
    setActiveTab('my-consultations');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-[600px]">
      {/* Sleek Header & Navigation - Only show navigation if not editing */}
      {!editingConsultation && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Consultations</h2>
            <p className="text-sm text-gray-500">Manage your booking availability</p>
          </div>

          {/* Modern Segmented Control */}
          <div className="bg-gray-100/80 p-1 rounded-xl flex items-center font-medium text-sm">
            <button
              onClick={() => setActiveTab('my-consultations')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'my-consultations' 
                  ? 'text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {activeTab === 'my-consultations' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <LayoutList className="w-4 h-4" />
                <span>Overview</span>
              </span>
            </button>

            <button
              onClick={handleCreateNew}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'create-new' 
                  ? 'text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {activeTab === 'create-new' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Create</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Content Area with Fade Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (editingConsultation || '')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'my-consultations' ? (
            <ConsultationList onEdit={handleEdit}  />
          ) : (
            <CreateConsultation editingId={editingConsultation} onBack={handleBackToList} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ConsultationOverview;