import { useState } from 'react';
import { Copy, Edit, Trash2, ExternalLink, Plus, Calendar, Clock, CheckCircle } from 'lucide-react';

interface Consultation {
  id: string;
  consultationType: string;
  companyName: string;
  duration: string;
  description: string;
  availableDays: string[];
  bufferHours: number;
  createdAt: string;
  bookingLink: string;
}

interface ConsultationListProps {
  onEdit: (id: string) => void;
  onCreateNew: () => void;
}

const ConsultationList = ({ onEdit, onCreateNew }: ConsultationListProps) => {
  // TODO: Replace with actual data from storage/API
  const [consultations, setConsultations] = useState<Consultation[]>([
    {
      id: 'demo-1',
      consultationType: 'Discovery Call',
      companyName: 'Tech Solutions Ltd',
      duration: '30 minutes',
      description: 'Initial project discussion',
      availableDays: ['Monday', 'Tuesday', 'Wednesday'],
      bufferHours: 48,
      createdAt: '2025-01-15',
      bookingLink: '/book/tech-solutions-ltd/discovery-call/demo-1'
    }
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (link: string, id: string) => {
    const fullUrl = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this consultation?')) {
      setConsultations(consultations.filter(c => c.id !== id));
    }
  };

  const canCreateNew = consultations.length < 2;

  return (
    <div className="space-y-6">
      {/* Create New Button - Only show if less than 2 */}
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
      {consultations.length === 0 ? (
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
          {consultations.map((consultation) => (
            <div
              key={consultation.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <h3 className="text-lg font-bold text-white">{consultation.consultationType}</h3>
                <p className="text-sm text-blue-100">{consultation.companyName}</p>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600">{consultation.description}</p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{consultation.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{consultation.bufferHours}hr buffer</span>
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
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
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