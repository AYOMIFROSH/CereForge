import { Request, Response } from 'express';
import supabase from '../config/database';
import { queueTeamNotification, queueClientConfirmation } from '../queues/email.queue';
import { logPartnerEvent } from '../services/audit.service';
import { validateFileUrls } from '../services/storage.service';
import { asyncHandler, Errors } from '../utils/errors';
import logger from '../utils/logger';

/**
 * POST /api/v1/public/get-started
 * Submit Get Started form (partner application) with optional file uploads
 */
export const submitGetStartedForm = asyncHandler(async (req: Request, res: Response) => {
  const formData = req.body;
  const ipAddress = req.ip || 'unknown';

  logger.info(`Get Started form submission from: ${formData.email}`);

  // Check if email already has pending application
  const { data: existing, error: checkError } = await supabase
    .from('pending_partners')
    .select('id, status')
    .eq('email', formData.email)
    .in('status', ['pending', 'reviewing'])
    .single();

  if (existing && !checkError) {
    throw Errors.conflict('An application with this email is already pending review');
  }

  // ✅ Validate file URLs if provided
  const fileUrls = [
    formData.projectBriefUrl,
    formData.referenceImagesUrl,
    formData.profilePhotoUrl
  ];

  const hasFiles = fileUrls.some(url => url && url.trim() !== '');

  if (hasFiles) {
    logger.info('Validating uploaded files...');
    const filesValid = await validateFileUrls(fileUrls);

    if (!filesValid) {
      logger.error('File validation failed - files do not exist in storage');
      throw Errors.badRequest('Some uploaded files could not be verified. Please try again.');
    }

    logger.info('File validation successful');
  }

  // Create pending partner record
  const { data: pendingPartner, error: insertError } = await supabase
    .from('pending_partners')
    .insert({
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.companyName,
      company_website: formData.companyWebsite || null,
      linkedin_profile: formData.linkedinProfile || null,
      project_title: formData.projectTitle,
      project_description: formData.projectDescription,
      project_stage: formData.projectStage,
      solution_type: formData.solutionType,
      ideal_start_date: formData.idealStartDate || null,
      budget_range: formData.budgetRange,
      currency: formData.currency || 'NGN',
      has_internal_team: formData.hasInternalTeam,
      schedule_call: formData.scheduleCall,
      status: 'pending',
      // ✅ Save file URLs
      project_brief_url: formData.projectBriefUrl || null,
      reference_images_url: formData.referenceImagesUrl || null,
      profile_photo_url: formData.profilePhotoUrl || null
    })
    .select()
    .single();

  if (insertError || !pendingPartner) {
    logger.error('Failed to create pending partner:', insertError);
    throw Errors.database('Failed to submit application');
  }

  // Log application submission
  await logPartnerEvent(
    'application_submitted',
    undefined,
    pendingPartner.id,
    ipAddress,
    {
      company_name: formData.companyName,
      project_title: formData.projectTitle,
      has_files: hasFiles
    }
  );

  // ✅ Queue team notification with applicationId
  queueTeamNotification({
    fullName: formData.fullName,
    email: formData.email,
    companyName: formData.companyName,
    projectTitle: formData.projectTitle,
    applicationId: pendingPartner.id
  }).catch(err => logger.error('Failed to queue team notification:', err));

  // ✅ Queue client confirmation with applicationId
  queueClientConfirmation({
    email: formData.email,
    fullName: formData.fullName,
    companyName: formData.companyName,
    projectTitle: formData.projectTitle,
    applicationId: pendingPartner.id
  }).catch(err => logger.error('Failed to queue client confirmation:', err));

  logger.info(`Get Started application created: ${pendingPartner.id}${hasFiles ? ' (with files)' : ''}`);

  res.status(201).json({
    success: true,
    data: {
      applicationId: pendingPartner.id,
      message: 'Your application has been submitted successfully. We will review it and get back to you within 48 hours.'
    },
    timestamp: new Date().toISOString()
  });
});