// src/services/pendingPartners.service.ts

import { getFreshSupabase } from '../config/database';
import supabase from '../config/database';
import { Errors } from '../utils/errors';
import { hashPassword, generateTemporaryPassword } from '../utils/password';
import { sendPartnerWelcomeEmail, sendApplicationRejectionEmail } from './email.service';
import { logPartnerEvent } from './audit.service';
import logger from '../utils/logger';

interface GetPendingPartnersParams {
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'company_name';
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
 * Get all partner applications with pagination and filtering
 * Returns minimal data for list view - fetch full details by ID when needed
 * By default, excludes approved applications to keep the list clean
 */
export async function getPendingPartners(
  params: GetPendingPartnersParams
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

    let query = supabase
      .from('pending_partners')
      .select(`
        id,
        full_name,
        email,
        company_name,
        project_title,
        project_stage,
        budget_range,
        status,
        created_at,
        reviewed_at,
        schedule_call
      `, { count: 'exact' });

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    } else {
      // By default, exclude approved applications
      query = query.neq('status', 'approved');
    }

    // Search by company name or email
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch partner applications:', error);
      throw Errors.database('Failed to fetch partner applications');
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
    logger.error('Get partner applications error:', error);
    throw Errors.internal('Failed to fetch partner applications');
  }
}

/**
 * Get single partner application by ID
 */
export async function getPendingPartnerById(id: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('pending_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw Errors.notFound('Partner application not found');
    }

    return data;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Get partner application by ID error:', error);
    throw Errors.internal('Failed to fetch partner application');
  }
}

/**
 * Approve partner application - Creates user account and partner record
 */
export async function approvePendingPartner(
  applicationId: string,
  adminUserId: string,
  ipAddress: string,
  notes?: string
): Promise<{ partner: any; temporaryPassword: string }> {
  const adminClient = getFreshSupabase();

  try {
    // 1. Get partner application
    const { data: application, error: fetchError } = await supabase
      .from('pending_partners')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw Errors.notFound('Partner application not found');
    }

    // 2. Check if already approved or rejected
    if (application.status === 'approved') {
      throw Errors.conflict('Application has already been approved');
    }

    if (application.status === 'rejected') {
      throw Errors.conflict('Cannot approve a rejected application');
    }

    // 3. Check if email already exists in user_profiles
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', application.email)
      .single();

    if (existingUser) {
      throw Errors.conflict('A user with this email already exists');
    }

    // 4. Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // 5. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: application.email,
      password: hashedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.full_name,
      },
    });

    if (authError || !authUser.user) {
      logger.error('Failed to create auth user:', authError);
      throw Errors.internal('Failed to create user account');
    }

    // 6. Create user profile and get partner count in parallel
    const [profileResult, countResult] = await Promise.all([
      adminClient.from('user_profiles').insert({
        id: authUser.user.id,
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        role: 'partner',
        status: 'active',
        system_type: 'SYSTEM_USERS',
      }),
      supabase.from('partners').select('id', { count: 'exact', head: true })
    ]);

    if (profileResult.error) {
      logger.error('Failed to create user profile:', profileResult.error);
      // Rollback: Delete auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw Errors.database('Failed to create user profile');
    }

    // 7. Generate partner_id
    const { count } = countResult;
    const partnerNumber = String((count || 0) + 1).padStart(3, '0');
    const partnerId = `PARTNER-${partnerNumber}`;

    // 8. Create partner record
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .insert({
        user_id: authUser.user.id,
        partner_id: partnerId,
        partner_name: application.company_name,
        company_website: application.company_website,
        linkedin_profile: application.linkedin_profile,
        project_title: application.project_title,
        project_description: application.project_description,
        project_stage: application.project_stage,
        solution_type: application.solution_type,
        ideal_start_date: application.ideal_start_date,
        budget_range: application.budget_range,
        currency: application.currency,
        has_internal_team: application.has_internal_team,
        schedule_call: application.schedule_call,
        onboarding_status: 'pending',
        approved_by: adminUserId,
        approved_at: new Date().toISOString(),
        project_brief_url: application.project_brief_url,
        reference_images_url: application.reference_images_url,
        profile_photo_url: application.profile_photo_url,
        metadata: notes ? { approval_notes: notes } : null,
      })
      .select()
      .single();

    if (partnerError || !partner) {
      logger.error('Failed to create partner record:', partnerError);
      // Rollback: Delete user profile and auth user
      await adminClient.from('user_profiles').delete().eq('id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw Errors.database('Failed to create partner record');
    }

    // 9. Update application status, log audit, and send email (non-blocking)
    Promise.all([
      adminClient
        .from('pending_partners')
        .update({
          status: 'approved',
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          converted_to_partner_id: partner.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId),
      
      logPartnerEvent(
        'application_approved',
        adminUserId,
        partner.id,
        ipAddress,
        {
          application_id: applicationId,
          company_name: application.company_name,
          partner_id: partnerId,
        }
      ),
      
      sendPartnerWelcomeEmail(
        application.email,
        application.company_name,
        temporaryPassword
      )
    ]).catch((err) => {
      logger.error('Background operations error:', err);
    });

    logger.info(`Partner application approved: ${applicationId} → Partner: ${partnerId}`);

    return { partner, temporaryPassword };
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Approve partner application error:', error);
    throw Errors.internal('Failed to approve partner application');
  }
}

/**
 * Reject partner application
 */
export async function rejectPendingPartner(
  applicationId: string,
  adminUserId: string,
  ipAddress: string,
  reason: string
): Promise<void> {
  const adminClient = getFreshSupabase();

  try {
    // 1. Get partner application
    const { data: application, error: fetchError } = await supabase
      .from('pending_partners')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw Errors.notFound('Partner application not found');
    }

    // 2. Check if already approved or rejected
    if (application.status === 'approved') {
      throw Errors.conflict('Cannot reject an approved application');
    }

    if (application.status === 'rejected') {
      throw Errors.conflict('Application has already been rejected');
    }

    // 3. Update status to rejected
    const { error: updateError } = await adminClient
      .from('pending_partners')
      .update({
        status: 'rejected',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      logger.error('Failed to reject partner application:', updateError);
      throw Errors.database('Failed to reject application');
    }

    // 4. Audit log
    await logPartnerEvent(
      'application_rejected',
      adminUserId,
      applicationId,
      ipAddress,
      {
        company_name: application.company_name,
        reason,
      }
    );

    sendApplicationRejectionEmail(
        application.email,
        application.company_name,
        reason
      )

    logger.info(`Partner application rejected: ${applicationId}`);
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Reject partner application error:', error);
    throw Errors.internal('Failed to reject partner application');
  }
}

/**
 * Update partner application status (pending ↔ reviewing)
 */
export async function updatePendingPartnerStatus(
  applicationId: string,
  status: 'pending' | 'reviewing',
  adminUserId: string,
  ipAddress: string
): Promise<any> {
  const adminClient = getFreshSupabase();

  try {
    // Get current application
    const { data: application, error: fetchError } = await supabase
      .from('pending_partners')
      .select('status')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw Errors.notFound('Partner application not found');
    }

    // Don't allow changing status of approved/rejected applications
    if (application.status === 'approved' || application.status === 'rejected') {
      throw Errors.conflict(`Cannot change status of ${application.status} application`);
    }

    // Update status
    const { data, error } = await adminClient
      .from('pending_partners')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error || !data) {
      throw Errors.database('Failed to update application status');
    }

    // Audit log
    await logPartnerEvent(
      'status_changed',
      adminUserId,
      applicationId,
      ipAddress,
      {
        old_status: application.status,
        new_status: status,
      }
    );

    logger.info(`Partner application status updated: ${applicationId} → ${status}`);

    return data;
  } catch (error) {
    if (error instanceof Errors) throw error;
    logger.error('Update partner application status error:', error);
    throw Errors.internal('Failed to update application status');
  }
}