// src/components/partners/tabs/PartnersList.tsx

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, CheckCircle, Loader2, AlertCircle, Filter, ChevronRight} from 'lucide-react';
import { motion } from 'framer-motion';
import { useGetPartnersQuery } from '@/store/api/partnersApi';
import type { PartnerOnboardingStatus } from '@/types/partners.types';
import PartnerDetail from './PartnerDetail'; 

const PartnersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get('partnerId');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerOnboardingStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isFetching, error } = useGetPartnersQuery({
    page: currentPage,
    limit: 20,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(searchQuery && { search: searchQuery })
  });

  const handlePartnerClick = (id: string) => {
    setSearchParams({ 
      tab: 'partners', 
      'partner-tab': 'partners',
      partnerId: id 
    });
  };

  const handleBack = () => {
    setSearchParams({ 
      tab: 'partners', 
      'partner-tab': 'partners'
    });
  };

  // 1. Detail View
  if (partnerId) {
    return (
      <div className="p-6">
        <PartnerDetail partnerId={partnerId} onBack={handleBack} />
      </div>
    );
  }

  const partners = data?.data.items || [];
  const pagination = data?.data.pagination;

  const getStatusStyle = (status: PartnerOnboardingStatus) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'paused': return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
      case 'suspended': return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Control Bar */}
      <div className="p-5 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partners by name or ID..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as PartnerOnboardingStatus | 'all')}
                      className="w-full md:w-40 pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer transition-all font-medium text-gray-700"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="suspended">Suspended</option>
                      <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 bg-gray-50/30">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm font-medium">Loading partners...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">Failed to load partners. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {partners.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No partners found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {partners.map((partner, index) => (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handlePartnerClick(partner.id)}
                    className="group bg-white rounded-xl border border-gray-200/60 p-4 cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 hover:border-blue-300/50 transition-all duration-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        {/* Identity (Cols 1-4) */}
                        <div className="md:col-span-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                                {partner.partner_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {partner.partner_name}
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{partner.partner_id}</p>
                            </div>
                        </div>

                        {/* Project Context (Cols 5-8) */}
                        <div className="md:col-span-4 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-700 truncate">{partner.project_title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                  {partner.project_stage}
                                </span>
                                {partner.approved_at && (
                                  <div className="flex items-center gap-1 text-[10px] text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Verified</span>
                                  </div>
                                )}
                            </div>
                        </div>

                        {/* Status & Meta (Cols 9-12) */}
                        <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-6">
                             <div className="flex flex-col items-end gap-1">
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ring-1 ${getStatusStyle(partner.onboarding_status)}`}>
                                    {partner.onboarding_status}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    <span>Joined {new Date(partner.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                             <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                                <ChevronRight className="w-4 h-4" />
                             </div>
                        </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200/50 mt-4">
                <p className="text-xs text-gray-500 font-medium">
                  Showing <span className="text-gray-900">{partners.length}</span> of {pagination.total} partners
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isFetching}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages || isFetching}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PartnersList;