// src/services/partners.service.ts

import { getFreshSupabase } from '../config/database';
import supabase from '../config/database';
import { Errors } from '../utils/errors';
import { logPartnerEvent } from './audit.service';
import logger from '../utils/logger';

interface GetPartnersParams {
  status?: 'active' | 'suspended' | 'paused' | 'completed';
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'partner_name';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get all partners with pagination and filtering
 * Returns minimal data for list view
 */
export async function getPartners(
  params: GetPartnersParams
): Promise<PaginatedResponse<any>> {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search,
    } = params;

    // Select minimal fields for list view
    let query = supabase
      .from('partners')
      .select(`
        id,
        user_id,
        partner_id,
        partner_name,
        project_title,
        project_stage,
        onboarding_status,
        created_at,
        approved_at
      `, { count: 'exact' });

    // Filter by onboarding status
    if (status) {
      query = query.eq('onboarding_status', status);
    }

    // Search by partner name
    if (search) {
      query = query.ilike('partner_name', `%${search}%`);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch partners:', error);
      throw Errors.database('Failed to fetch partners');
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      items: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Get partners error:', error);
    throw Errors.internal('Failed to fetch partners');
  }
}

/**
 * Get single partner by ID (with full details)
 */
export async function getPartnerById(id: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw Errors.notFound('Partner not found');
    }

    return data;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Get partner by ID error:', error);
    throw Errors.internal('Failed to fetch partner');
  }
}

/**
 * Update partner information
 */
export async function updatePartner(
  partnerId: string,
  updateData: any,
  adminUserId: string,
  ipAddress: string
): Promise<any> {
  const adminClient = getFreshSupabase();

  try {
    // Check if partner exists
    const { data: existingPartner, error: fetchError } = await supabase
      .from('partners')
      .select('partner_name, partner_id')
      .eq('id', partnerId)
      .single();

    if (fetchError || !existingPartner) {
      throw Errors.notFound('Partner not found');
    }

    // Build update object (only allow specific fields)
    const allowedUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    // Partner information
    if (updateData.partner_name !== undefined) allowedUpdates.partner_name = updateData.partner_name;
    if (updateData.company_website !== undefined) allowedUpdates.company_website = updateData.company_website;
    if (updateData.linkedin_profile !== undefined) allowedUpdates.linkedin_profile = updateData.linkedin_profile;
    if (updateData.industry !== undefined) allowedUpdates.industry = updateData.industry;
    if (updateData.company_size !== undefined) allowedUpdates.company_size = updateData.company_size;

    // Project information
    if (updateData.project_title !== undefined) allowedUpdates.project_title = updateData.project_title;
    if (updateData.project_description !== undefined) allowedUpdates.project_description = updateData.project_description;
    if (updateData.project_stage !== undefined) allowedUpdates.project_stage = updateData.project_stage;
    if (updateData.solution_type !== undefined) allowedUpdates.solution_type = updateData.solution_type;
    if (updateData.ideal_start_date !== undefined) allowedUpdates.ideal_start_date = updateData.ideal_start_date;
    if (updateData.budget_range !== undefined) allowedUpdates.budget_range = updateData.budget_range;
    if (updateData.currency !== undefined) allowedUpdates.currency = updateData.currency;
    if (updateData.has_internal_team !== undefined) allowedUpdates.has_internal_team = updateData.has_internal_team;
    if (updateData.schedule_call !== undefined) allowedUpdates.schedule_call = updateData.schedule_call;

    // Metadata
    if (updateData.metadata !== undefined) allowedUpdates.metadata = updateData.metadata;

    // Update partner
    const { data, error } = await adminClient
      .from('partners')
      .update(allowedUpdates)
      .eq('id', partnerId)
      .select()
      .single();

    if (error || !data) {
      logger.error('Failed to update partner:', error);
      throw Errors.database('Failed to update partner');
    }

    // Audit log
    await logPartnerEvent(
      'partner_updated',
      adminUserId,
      partnerId,
      ipAddress,
      {
        partner_name: existingPartner.partner_name,
        partner_id: existingPartner.partner_id,
        updated_fields: Object.keys(updateData),
      }
    );

    logger.info(`Partner updated: ${partnerId} by admin: ${adminUserId}`);

    return data;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Update partner error:', error);
    throw Errors.internal('Failed to update partner');
  }
}

/**
 * Update partner status (active, suspended, paused, completed)
 */
export async function updatePartnerStatus(
  partnerId: string,
  newStatus: 'active' | 'suspended' | 'paused' | 'completed',
  adminUserId: string,
  ipAddress: string
): Promise<any> {
  const adminClient = getFreshSupabase();

  try {
    // Get current partner
    const { data: partner, error: fetchError } = await supabase
      .from('partners')
      .select('onboarding_status, partner_name, partner_id')
      .eq('id', partnerId)
      .single();

    if (fetchError || !partner) {
      throw Errors.notFound('Partner not found');
    }

    // Update status
    const { data, error } = await adminClient
      .from('partners')
      .update({
        onboarding_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId)
      .select()
      .single();

    if (error || !data) {
      throw Errors.database('Failed to update partner status');
    }

    // Audit log
    await logPartnerEvent(
      'partner_status_changed',
      adminUserId,
      partnerId,
      ipAddress,
      {
        partner_name: partner.partner_name,
        partner_id: partner.partner_id,
        old_status: partner.onboarding_status,
        new_status: newStatus,
      }
    );

    logger.info(`Partner status updated: ${partnerId} → ${newStatus}`);

    return data;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Update partner status error:', error);
    throw Errors.internal('Failed to update partner status');
  }
}