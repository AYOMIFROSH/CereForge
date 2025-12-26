import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConsultationList from './ConsultationList';
import CreateConsultation from './CreateConsultation';

type ConsultationTab = 'my-consultations' | 'create-new';

const ConsultationOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabFromURL = (searchParams.get('consultation-tab') as ConsultationTab) || 'my-consultations';
  const [activeTab, setActiveTab] = useState<ConsultationTab>(tabFromURL);
  const [editingConsultation, setEditingConsultation] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== tabFromURL) {
      setSearchParams({ tab: 'consultation', 'consultation-tab': activeTab }, { replace: true });
    }
  }, [activeTab, tabFromURL, setSearchParams]);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'my-consultations':
        return <ConsultationList onEdit={handleEdit} onCreateNew={handleCreateNew} />;
      case 'create-new':
        return <CreateConsultation editingId={editingConsultation} onBack={handleBackToList} />;
      default:
        return <ConsultationList onEdit={handleEdit} onCreateNew={handleCreateNew} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Consultation Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage your booking consultations</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('my-consultations')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my-consultations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Consultations
          </button>
          <button
            onClick={() => handleCreateNew()}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'create-new'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create New
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>
    </div>
  );
};

export default ConsultationOverview;