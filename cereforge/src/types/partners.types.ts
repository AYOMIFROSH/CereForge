// src/types/partners.types.ts

// ============================================
// PARTNER APPLICATION TYPES
// ============================================

export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface PartnerApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_website: string;
  linkedin_profile: string | null;
  project_title: string;
  project_description: string;
  project_stage: string;
  solution_type: string;
  ideal_start_date: string;
  budget_range: string;
  currency: string;
  has_internal_team: boolean;
  schedule_call: boolean;
  project_brief_url: string;
  reference_images_url: string;
  profile_photo_url: string;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  converted_to_partner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerApplicationListItem {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  project_title: string;
  project_stage: string;
  budget_range: string;
  status: ApplicationStatus;
  created_at: string;
  reviewed_at: string | null;
  schedule_call: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PartnerApplicationsListResponse {
  success: boolean;
  data: {
    items: PartnerApplicationListItem[];
    pagination: Pagination;
  };
  timestamp: string;
}

export interface PartnerApplicationDetailResponse {
  success: boolean;
  data: PartnerApplication;
  timestamp: string;
}

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
  notes?: string;
  reason?: string;
}

export interface UpdateApplicationStatusResponse {
  success: boolean;
  data: PartnerApplication;
  message: string;
  timestamp: string;
}

// ============================================
// PARTNER TYPES
// ============================================

export type PartnerOnboardingStatus = 'active' | 'suspended' | 'paused' | 'completed';

export interface Partner {
  id: string;
  user_id: string;
  partner_id: string;
  partner_name: string;
  company_website: string | null;
  linkedin_profile: string | null;
  industry: string;
  company_size: string;
  project_title: string;
  project_description: string;
  project_stage: string;
  solution_type: string;
  ideal_start_date: string | null;
  budget_range: string;
  currency: string;
  has_internal_team: boolean;
  schedule_call: boolean;
  onboarding_status: PartnerOnboardingStatus;
  approved_by: string | null;
  approved_at: string | null;
  project_brief_url: string | null;
  reference_images_url: string | null;
  profile_photo_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PartnerListItem {
  id: string;
  user_id: string;
  partner_id: string;
  partner_name: string;
  project_title: string;
  project_stage: string;
  onboarding_status: PartnerOnboardingStatus;
  created_at: string;
  approved_at: string | null;
}

export interface PartnersListResponse {
  success: boolean;
  data: {
    items: PartnerListItem[];
    pagination: Pagination;
  };
  timestamp: string;
}

export interface PartnerDetailResponse {
  success: boolean;
  data: Partner;
  timestamp: string;
}

export interface UpdatePartnerInput {
  partner_name?: string;
  company_website?: string;
  linkedin_profile?: string;
  industry?: string;
  company_size?: string;
  project_title?: string;
  project_description?: string;
  project_stage?: string;
  solution_type?: string;
  ideal_start_date?: string;
  budget_range?: string;
  currency?: string;
  has_internal_team?: boolean;
  schedule_call?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdatePartnerResponse {
  success: boolean;
  data: Partner;
  message: string;
  timestamp: string;
}

export interface UpdatePartnerStatusInput {
  status: PartnerOnboardingStatus;
}

export interface UpdatePartnerStatusResponse {
  success: boolean;
  data: Partner;
  message: string;
  timestamp: string;
}

// ============================================
// QUERY PARAMS
// ============================================

export interface GetApplicationsParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  search?: string;
}

export interface GetPartnersParams {
  page?: number;
  limit?: number;
  status?: PartnerOnboardingStatus;
  search?: string;
}