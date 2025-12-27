import { useState, useEffect } from 'react';
import { 
  Edit, Trash2, ExternalLink, Calendar, Clock, 
  CheckCircle2, Power, PowerOff, Globe, Sparkles,
  Link as LinkIcon, Building2
} from 'lucide-react';
import { useAppSelector } from '@/store/hook';
import { selectUser } from '@/store/slices/authSlice';
import { SYSTEM_BOOKING_CONSULTATIONS } from '@/utils/ConsultationConstants';
import { getTimezoneDisplay } from '@/utils/TimezoneUtils';

interface Consultation {
  id: string;
  consultationType: string;
  companyName: string;
  duration: string;
  description: string;
  availableDays: string[];
  bufferHours: number;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  bookingLink: string;
  isSystemBooking?: boolean;
}

interface ConsultationListProps {
  onEdit: (id: string) => void;
  // onCreateNew removed from here as it is handled by parent
}

const ConsultationList = ({ onEdit }: ConsultationListProps) => {
  const user = useAppSelector(selectUser);
  const isAdminOrCore = user?.role === 'admin' || user?.role === 'core';

  const [individualConsultations, setIndividualConsultations] = useState<Consultation[]>([]);
  const [systemConsultations, setSystemConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    if (isAdminOrCore) {
      const systemBooking: Consultation = {
        id: 'system_booking_consult',
        consultationType: 'System Booking',
        companyName: 'Cereforge',
        duration: '30, 60, 30',
        description: 'Global availability for Discovery, Technical, and Follow-up meetings.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday'],
        bufferHours: 48,
        timezone: 'Africa/Lagos',
        isActive: true,
        createdAt: new Date().toISOString(),
        bookingLink: `/book/cereforge/system/system_booking_consult`,
        isSystemBooking: true
      };
      setSystemConsultations([systemBooking]);
    }
    // TODO: Fetch individual consultations from backend API
  }, [isAdminOrCore]);

  const allConsultations = [...systemConsultations, ...individualConsultations];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (link: string, id: string) => {
    const fullUrl = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (id === 'system_booking_consult') {
      alert('System booking cannot be deleted. This is managed by Cereforge.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this consultation?')) {
      setIndividualConsultations(individualConsultations.filter(c => c.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    if (id === 'system_booking_consult') {
      setSystemConsultations(systemConsultations.map(c => 
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ));
    } else {
      setIndividualConsultations(individualConsultations.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ));
    }
  };

  const canCreateNew = individualConsultations.length < 2;

  // --- Helper Component for Status Badge ---
  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      <span>{isActive ? 'Active' : 'Paused'}</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Action - Removed Button, kept Limit Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Your Bookings</h2>
        {!canCreateNew && (
          <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            Limit Reached (2/2)
          </span>
        )}
      </div>

      {/* Empty State */}
      {allConsultations.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium">No consultations set up</h3>
          <p className="text-gray-500 text-sm mt-1">
             Switch to the "Create" tab to start accepting bookings
          </p>
        </div>
      )}

      {/* Consultations List */}
      <div className="space-y-4">
        {allConsultations.map((consultation) => {
          const isSystem = consultation.isSystemBooking;
          
          return (
            <div 
              key={consultation.id}
              className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden
                ${consultation.isActive 
                  ? 'border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200' 
                  : 'border-gray-100 bg-gray-50/50'
                }
              `}
            >
              {/* Colored Accent Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isSystem ? 'bg-purple-600' : 'bg-blue-600'}`} />

              <div className="flex flex-col md:flex-row md:items-center p-5 pl-7 gap-6">
                
                {/* 1. Icon & Core Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {isSystem ? (
                      <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className={`text-base font-bold truncate ${consultation.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                          {consultation.consultationType}
                        </h3>
                        <StatusBadge isActive={consultation.isActive} />
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{consultation.companyName}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-1 mb-3 pr-4">
                    {consultation.description}
                  </p>

                  {/* Tags for System Booking */}
                  {isSystem && (
                    <div className="flex flex-wrap gap-2">
                      {SYSTEM_BOOKING_CONSULTATIONS.map(t => (
                        <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                           {t.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Metadata Column */}
                <div className="flex flex-row md:flex-col gap-3 md:gap-1 text-xs text-gray-500 min-w-[140px] md:border-l md:border-gray-100 md:pl-6">
                  <div className="flex items-center gap-2" title="Duration">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{isSystem ? 'Var. Duration' : `${consultation.duration} mins`}</span>
                  </div>
                  <div className="flex items-center gap-2" title="Buffer Time">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{consultation.bufferHours}h buffer</span>
                  </div>
                  <div className="flex items-center gap-2" title="Timezone">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate max-w-[100px]">
                      {getTimezoneDisplay(consultation.timezone).split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* 3. Action Buttons */}
                <div className="flex items-center justify-end gap-2 md:pl-4">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                    <button
                      onClick={() => handleToggleActive(consultation.id)}
                      className={`p-2 rounded-md transition-colors ${
                        consultation.isActive 
                          ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' 
                          : 'text-green-600 bg-white shadow-sm'
                      }`}
                      title={consultation.isActive ? "Pause Booking" : "Activate Booking"}
                    >
                      {consultation.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    
                    <div className="w-px h-4 bg-gray-200 mx-1" />

                    <button
                      onClick={() => window.open(consultation.bookingLink, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Preview Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopyLink(consultation.bookingLink, consultation.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors relative"
                      title="Copy Booking Link"
                    >
                      {copiedId === consultation.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onEdit(consultation.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit Configuration"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  {!isSystem && (
                    <button
                      onClick={() => handleDelete(consultation.id)}
                      className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConsultationList;