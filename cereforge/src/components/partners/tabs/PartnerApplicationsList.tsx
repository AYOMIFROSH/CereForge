// src/components/partners/tabs/PartnerApplicationsList.tsx

import { useState } from 'react';
import { 
  ChevronLeft, Mail, Phone, Globe, Linkedin, Calendar, DollarSign, 
  Users, FileText, Loader2, CheckCircle, XCircle, Clock, ExternalLink, 
  Search, AlertCircle, Filter, ChevronRight
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

  // 1. Detail View
  if (selectedId) {
    // Note: You would use your actual PartnerApplicationDetail component here
    return (
      <div className="p-6">
        <PartnerApplicationDetail 
          applicationId={selectedId} 
          onBack={() => setSelectedId(null)} 
        />
      </div>
    );
  }

  // 2. List View
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-5 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <h3 className="text-lg font-bold text-gray-900">Recent Applications</h3>
             <p className="text-xs text-gray-500 mt-0.5">Review and onboard new potential partners</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
               <input
                 type="text"
                 placeholder="Search by name, company..."
                 className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
               />
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 bg-gray-50/30">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm font-medium">Loading applications...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">Failed to load applications.</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3">
            {data?.data.items.length === 0 ? (
               <div className="text-center py-20">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-gray-400" />
                 </div>
                 <h3 className="text-gray-900 font-medium">No applications found</h3>
                 <p className="text-sm text-gray-500 mt-1">New applications will appear here.</p>
               </div>
            ) : (
              data?.data.items.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedId(app.id)}
                  className="group bg-white rounded-xl border border-gray-200/60 p-4 cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 hover:border-blue-300/50 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Status Strip on Hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Identity Section (Cols 1-5) */}
                    <div className="md:col-span-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shadow-inner">
                            {app.company_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {app.company_name}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">{app.full_name} • {app.email}</p>
                        </div>
                    </div>

                    {/* Project Info (Cols 6-9) */}
                    <div className="md:col-span-4 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate mb-1">
                            {app.project_title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                             <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                                <DollarSign className="w-3 h-3" />
                                <span>{app.budget_range}</span>
                             </div>
                             <span className="capitalize text-gray-400">{app.project_stage}</span>
                        </div>
                    </div>

                    {/* Status & Date (Cols 10-12) */}
                    <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-6">
                        <div className="flex flex-col items-end gap-1">
                            <span className={`
                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                ${app.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 
                                  app.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' : 
                                  app.status === 'reviewing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-red-50 text-red-700 border border-red-200'}
                            `}>
                                {app.status === 'pending' && <Clock className="w-3 h-3" />}
                                {app.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                {app.status === 'reviewing' && <FileText className="w-3 h-3" />}
                                {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                {app.status}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerApplicationsList;