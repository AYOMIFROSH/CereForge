import { useState, useEffect } from 'react';
import { Copy, Edit, Trash2, ExternalLink, Plus, Calendar, Clock, CheckCircle, Power, PowerOff, Globe } from 'lucide-react';
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
  timezone: string; // ✅ NEW
  isActive: boolean; // ✅ NEW
  createdAt: string;
  bookingLink: string;
  isSystemBooking?: boolean;
}

interface ConsultationListProps {
  onEdit: (id: string) => void;
  onCreateNew: () => void;
}

const ConsultationList = ({ onEdit, onCreateNew }: ConsultationListProps) => {
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
        duration: '30, 60, 30 minutes',
        description: 'Cereforge team consultation booking (Discovery Call, Technical Review, Follow-up Meeting)',
        availableDays: ['Monday', 'Tuesday', 'Wednesday'],
        bufferHours: 48,
        timezone: 'Africa/Lagos', // ✅ NEW
        isActive: true, // ✅ NEW
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
      // TODO: Call backend API to delete
      setIndividualConsultations(individualConsultations.filter(c => c.id !== id));
    }
  };

  // ✅ NEW: Toggle active/paused status
  const handleToggleActive = (id: string) => {
    // TODO: Call backend API to toggle status
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

  return (
    <div className="space-y-6">
      {/* Create New Button */}
      {canCreateNew && (
        <div className="flex justify-end">
          <button
            onClick={onCreateNew}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Consultation</span>
          </button>
        </div>
      )}

      {/* Max Limit Warning */}
      {!canCreateNew && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Maximum limit reached:</span> You can create up to 2 consultations. Delete one to create a new consultation.
          </p>
        </div>
      )}

      {/* Consultations Grid */}
      {allConsultations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No consultations yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first consultation to start accepting bookings</p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Create Consultation</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allConsultations.map((consultation) => (
            <div
              key={consultation.id}
              className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-shadow ${
                consultation.isActive ? 'border-gray-100' : 'border-gray-300 opacity-75'
              }`}
            >
              {/* Header */}
              <div className={`p-4 relative ${
                consultation.isSystemBooking 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700' 
                  : consultation.isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{consultation.consultationType}</h3>
                    <p className="text-sm text-blue-100">{consultation.companyName}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {consultation.isSystemBooking && (
                      <span className="px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded">
                        System
                      </span>
                    )}
                    {/* ✅ Active/Paused Badge */}
                    <button
                      onClick={() => handleToggleActive(consultation.id)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        consultation.isActive
                          ? 'bg-green-500/20 text-white hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-white hover:bg-gray-500/30'
                      }`}
                      title={consultation.isActive ? 'Click to pause' : 'Click to resume'}
                    >
                      {consultation.isActive ? (
                        <span className="flex items-center space-x-1">
                          <Power className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <PowerOff className="w-3 h-3" />
                          <span>Paused</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600">{consultation.description}</p>

                {/* Show consultation types for system booking */}
                {consultation.isSystemBooking && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Consultation Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {SYSTEM_BOOKING_CONSULTATIONS.map((type) => (
                        <span
                          key={type.id}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200"
                        >
                          {type.icon} {type.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{consultation.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{consultation.bufferHours}hr buffer</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[100px]">{getTimezoneDisplay(consultation.timezone).split(' ')[0]}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Available Days:</p>
                  <div className="flex flex-wrap gap-1">
                    {consultation.availableDays.map((day) => (
                      <span
                        key={day}
                        className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Booking Link */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Booking Link:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}${consultation.bookingLink}`}
                      readOnly
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded text-gray-600 truncate"
                    />
                    <button
                      onClick={() => handleCopyLink(consultation.bookingLink, consultation.id)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Copy link"
                    >
                      {copiedId === consultation.id ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => window.open(consultation.bookingLink, '_blank')}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(consultation.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(consultation.id)}
                    disabled={consultation.isSystemBooking}
                    className={`p-2 rounded transition-colors ${
                      consultation.isSystemBooking 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={consultation.isSystemBooking ? 'System booking cannot be deleted' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsultationList;