// src/components/partners/tabs/PartnerApplicationsList.tsx

import { useState } from 'react';
import { 
  ChevronLeft, Mail, Phone, Globe, Linkedin, Calendar, DollarSign, 
  Users, FileText, Loader2, CheckCircle, XCircle, Clock, ExternalLink, 
  Search, AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  useGetPartnerApplicationQuery, 
  useUpdateApplicationStatusMutation, 
  useGetPartnerApplicationsQuery 
} from '@/store/api/partnersApi';
import type { ApplicationStatus } from '@/types/partners.types';
import { useAppDispatch } from '@/store/hook';
import { addToast } from '@/store/slices/uiSlice';

// ==========================================
// 1. THE DETAIL COMPONENT
// ==========================================

interface PartnerApplicationDetailProps {
  applicationId: string;
  onBack: () => void;
}

const PartnerApplicationDetail = ({ applicationId, onBack }: PartnerApplicationDetailProps) => {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useGetPartnerApplicationQuery(applicationId);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();
  
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const application = data?.data;

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === 'rejected') {
      setShowRejectModal(true);
      setShowStatusMenu(false);
      return;
    }

    try {
      const response = await updateStatus({
        id: applicationId,
        body: { status: newStatus }
      }).unwrap();

      dispatch(addToast({
        message: response.message, // Server success message
        type: 'success',
        duration: 3000
      }));
      setShowStatusMenu(false);
    } catch (err: any) {
      dispatch(addToast({
        message: err?.data?.message || 'Operation failed', // Server error message
        type: 'error',
        duration: 5000
      }));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      dispatch(addToast({
        message: 'Please provide a rejection reason',
        type: 'warning',
        duration: 3000
      }));
      return;
    }

    try {
      const response = await updateStatus({
        id: applicationId,
        body: { status: 'rejected', reason: rejectionReason }
      }).unwrap();

      dispatch(addToast({
        message: response.message, // Server success message
        type: 'success',
        duration: 3000
      }));
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err: any) {
      dispatch(addToast({
        message: err?.data?.message || 'Operation failed', // Server error message
        type: 'error',
        duration: 5000
      }));
    }
  };

  const getStatusConfig = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock };
      case 'reviewing': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileText };
      case 'approved': return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
      case 'rejected': return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">Failed to load application details</p>
      </div>
    );
  }

  const StatusIcon = getStatusConfig(application.status).icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Applications</span>
        </button>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusConfig(application.status).color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-xs font-semibold capitalize">{application.status}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={isUpdating}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {isUpdating ? 'Updating...' : 'Change Status'}
            </button>

            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
              >
                {(['pending', 'reviewing', 'approved', 'rejected'] as ApplicationStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === application.status}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    <span className="capitalize">{status}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Contact */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Company & Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Name</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{application.company_name}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{application.full_name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{application.phone}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{application.email}</p>
                </div>
              </div>
              {application.company_website && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Website</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <a href={application.company_website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      {application.company_website}
                    </a>
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
              )}
              {application.linkedin_profile && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">LinkedIn</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Linkedin className="w-3 h-3 text-gray-400" />
                    <a href={application.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View Profile
                    </a>
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Project Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Title</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{application.project_title}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{application.project_description}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Stage</label>
                  <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{application.project_stage}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Solution Type</label>
                  <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{application.solution_type}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ideal Start Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{new Date(application.ideal_start_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget Range</label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-3 h-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{application.budget_range} {application.currency}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {application.has_internal_team ? 'Has internal team' : 'No internal team'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</label>
                <p className="text-gray-900 mt-1">{new Date(application.created_at).toLocaleString()}</p>
              </div>
              {application.reviewed_at && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reviewed</label>
                  <p className="text-gray-900 mt-1">{new Date(application.reviewed_at).toLocaleString()}</p>
                </div>
              )}
              {application.rejection_reason && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejection Reason</label>
                  <p className="text-red-700 mt-1">{application.rejection_reason}</p>
                </div>
              )}
              {application.schedule_call && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700">Requested consultation call</p>
                </div>
              )}
            </div>
          </div>

          {(application.project_brief_url || application.reference_images_url || application.profile_photo_url) && (
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {application.project_brief_url && (
                  <a href={`${import.meta.env.VITE_API_URL}/files/${application.project_brief_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Project Brief</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                  </a>
                )}
                {application.reference_images_url && (
                  <a href={`${import.meta.env.VITE_API_URL}/files/${application.reference_images_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Reference Images</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                  </a>
                )}
                {application.profile_photo_url && (
                  <a href={`${import.meta.env.VITE_API_URL}/files/${application.profile_photo_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Profile Photo</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Application</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              rows={4}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. THE MAIN LIST COMPONENT
// ==========================================

const PartnerApplicationsList = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
const { data, isLoading, error } = useGetPartnerApplicationsQuery({});

  // 1. If an ID is selected, show the Detail view
  if (selectedId) {
    return (
      <PartnerApplicationDetail 
        applicationId={selectedId} 
        onBack={() => setSelectedId(null)} 
      />
    );
  }

  // 2. Otherwise, show the List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Recent Applications</h3>
        <div className="relative w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
           <input
             type="text"
             placeholder="Search applications..."
             className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
           />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">Failed to load applications.</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid gap-3">
          {data?.data.items.length === 0 ? (
             <div className="text-center py-12 text-gray-500">No applications found.</div>
          ) : (
            data?.data.items.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedId(app.id)}
                className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {app.project_title}
                      </h4>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full 
                        ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          app.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          'bg-gray-100 text-gray-700'}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{app.company_name} • {app.full_name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{app.budget_range}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                    {app.company_name.charAt(0)}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerApplicationsList;