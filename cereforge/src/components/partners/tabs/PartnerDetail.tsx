// src/components/partners/PartnerDetail.tsx

import { useState, useEffect } from 'react';
import { ChevronLeft, Mail, Globe, Linkedin, Calendar, DollarSign, Users, FileText, Loader2, Save, Edit2, X, CheckCircle, XCircle, Pause, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGetPartnerQuery, useUpdatePartnerMutation, useUpdatePartnerStatusMutation } from '@/store/api/partnersApi';
import type { PartnerOnboardingStatus, UpdatePartnerInput } from '@/types/partners.types';
import { useAppDispatch } from '@/store/hook';
import { addToast } from '@/store/slices/uiSlice';

interface PartnerDetailProps {
  partnerId: string;
  onBack: () => void;
}

const PartnerDetail = ({ partnerId, onBack }: PartnerDetailProps) => {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useGetPartnerQuery(partnerId);
  const [updatePartner, { isLoading: isUpdating }] = useUpdatePartnerMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdatePartnerStatusMutation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [formData, setFormData] = useState<UpdatePartnerInput>({});

  const partner = data?.data;

  useEffect(() => {
    if (partner) {
      setFormData({
        partner_name: partner.partner_name,
        company_website: partner.company_website || '',
        linkedin_profile: partner.linkedin_profile || '',
        industry: partner.industry,
        company_size: partner.company_size,
        project_title: partner.project_title,
        project_description: partner.project_description,
        project_stage: partner.project_stage,
        solution_type: partner.solution_type,
        ideal_start_date: partner.ideal_start_date || '',
        budget_range: partner.budget_range,
        currency: partner.currency,
        has_internal_team: partner.has_internal_team,
        schedule_call: partner.schedule_call
      });
    }
  }, [partner]);

  const handleSave = async () => {
    try {
      const response = await updatePartner({
        id: partnerId,
        body: formData
      }).unwrap();

      dispatch(addToast({
        message: response.message, // Server success message
        type: 'success',
        duration: 3000
      }));
      setIsEditing(false);
    } catch (err: any) {
      dispatch(addToast({
        message: err?.data?.message || 'Update failed', // Server error message
        type: 'error',
        duration: 5000
      }));
    }
  };

  const handleStatusChange = async (newStatus: PartnerOnboardingStatus) => {
    try {
      const response = await updateStatus({
        id: partnerId,
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
        message: err?.data?.message || 'Update failed', // Server error message
        type: 'error',
        duration: 5000
      }));
    }
  };

  const getStatusConfig = (status: PartnerOnboardingStatus) => {
    switch (status) {
      case 'active': return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
      case 'paused': return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Pause };
      case 'suspended': return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
      case 'completed': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">Failed to load partner details</p>
      </div>
    );
  }

  const StatusIcon = getStatusConfig(partner.onboarding_status).icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Partners</span>
        </button>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusConfig(partner.onboarding_status).color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-xs font-semibold capitalize">{partner.onboarding_status}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={isUpdatingStatus}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {isUpdatingStatus ? 'Updating...' : 'Change Status'}
            </button>

            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
              >
                {(['active', 'paused', 'suspended', 'completed'] as PartnerOnboardingStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === partner.onboarding_status}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    <span className="capitalize">{status}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    partner_name: partner.partner_name,
                    company_website: partner.company_website || '',
                    linkedin_profile: partner.linkedin_profile || '',
                    industry: partner.industry,
                    company_size: partner.company_size,
                    project_title: partner.project_title,
                    project_description: partner.project_description,
                    project_stage: partner.project_stage,
                    solution_type: partner.solution_type,
                    ideal_start_date: partner.ideal_start_date || '',
                    budget_range: partner.budget_range,
                    currency: partner.currency,
                    has_internal_team: partner.has_internal_team,
                    schedule_call: partner.schedule_call
                  });
                }}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdating ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Company Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Partner Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{partner.partner_name}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Industry</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{partner.industry}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Company Size</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_size}
                      onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{partner.company_size}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.company_website}
                    onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                ) : partner.company_website ? (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <a href={partner.company_website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      {partner.company_website}
                    </a>
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not provided</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">LinkedIn</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.linkedin_profile}
                    onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                ) : partner.linkedin_profile ? (
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-3 h-3 text-gray-400" />
                    <a href={partner.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View Profile
                    </a>
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Not provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Project Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Project Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.project_title}
                    onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{partner.project_title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={formData.project_description}
                    onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{partner.project_description}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Project Stage</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.project_stage}
                      onChange={(e) => setFormData({ ...formData, project_stage: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 capitalize">{partner.project_stage}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Solution Type</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.solution_type}
                      onChange={(e) => setFormData({ ...formData, solution_type: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 capitalize">{partner.solution_type}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.ideal_start_date}
                      onChange={(e) => setFormData({ ...formData, ideal_start_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : partner.ideal_start_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">{new Date(partner.ideal_start_date).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not set</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Budget</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.budget_range}
                        onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">{partner.budget_range} {partner.currency}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {partner.has_internal_team ? 'Has internal team' : 'No internal team'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Partner ID Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Partner ID</h3>
            <p className="text-2xl font-bold text-blue-900">{partner.partner_id}</p>
          </div>

          {/* Metadata */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Metadata</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</label>
                <p className="text-gray-900 mt-1">{new Date(partner.created_at).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</label>
                <p className="text-gray-900 mt-1">{new Date(partner.updated_at).toLocaleString()}</p>
              </div>

              {partner.approved_at && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approved</label>
                  <p className="text-gray-900 mt-1">{new Date(partner.approved_at).toLocaleString()}</p>
                </div>
              )}

              {partner.schedule_call && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700">Requested consultation call</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {(partner.project_brief_url || partner.reference_images_url || partner.profile_photo_url) && (
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Attachments</h3>
              
              <div className="space-y-2">
                {partner.project_brief_url && (
                  <a href={`${import.meta.env.VITE_API_URL}/files/${partner.project_brief_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Project Brief</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                  </a>
                )}
                {partner.reference_images_url && (
                  <a href={`${import.meta.env.VITE_API_URL}/files/${partner.reference_images_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Reference Images</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                  </a>
                )}
                {partner.profile_photo_url && (
                  <a href={`${import.meta.env.VITE_API_URL}/files/${partner.profile_photo_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
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
    </div>
  );
};

export default PartnerDetail;