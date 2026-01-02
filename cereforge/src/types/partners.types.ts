export interface PendingPartner {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    company_name: string;
    company_website: string;
    linkedin_profile: string | null;
    project_title: string;
    project_description: string;
    project_stage: string;       // could be narrowed to a union type if you have enums
    solution_type: string;       // same here
    ideal_start_date: string;    // ISO date string
    budget_range: string;
    currency: string;
    has_internal_team: boolean;
    schedule_call: boolean;
    project_brief_url: string;
    reference_images_url: string;
    profile_photo_url: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected' | string; // adjust if you know exact statuses
    reviewed_by: string | null;
    reviewed_at: string | null;          // ISO date string or null
    rejection_reason: string | null;
    converted_to_partner_id: string | null;
    created_at: string;                  // ISO date string
    updated_at: string;                  // ISO date string
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PendingPartnersData {
    items: PendingPartner[];
    pagination: Pagination;
}

export interface GetPendingPartnersResponse {
    success: boolean;
    data: PendingPartnersData;
    timestamp: string; // ISO date string
}