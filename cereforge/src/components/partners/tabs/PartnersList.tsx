import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
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

  // If partner ID is in URL, show detail view
  if (partnerId) {
    return <PartnerDetail partnerId={partnerId} onBack={handleBack} />;
  }

  const partners = data?.data.items || [];
  const pagination = data?.data.pagination;

  const getStatusColor = (status: PartnerOnboardingStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PartnerOnboardingStatus | 'all')}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="suspended">Suspended</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">Failed to load partners. Please try again.</p>
        </div>
      )}

      {/* Partners List */}
      {!isLoading && !error && (
        <>
          {partners.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No partners found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {partners.map((partner) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handlePartnerClick(partner.id)}
                  className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {partner.partner_name}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusColor(partner.onboarding_status)}`}>
                          {partner.onboarding_status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="font-medium text-gray-700 truncate max-w-[200px]">{partner.partner_id}</span>
                        <span className="text-gray-300">•</span>
                        <span className="truncate max-w-[250px]">{partner.project_title}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(partner.created_at).toLocaleDateString()}</span>
                        </div>
                        {partner.approved_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Approved {new Date(partner.approved_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                          {partner.project_stage}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <span className="text-xs font-bold text-blue-600">
                          {partner.partner_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {partners.length} of {pagination.total} partners
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isFetching}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages || isFetching}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PartnersList;