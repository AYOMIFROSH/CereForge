import { createAuditLog } from './audit.service';
import logger from '../utils/logger';

/**
 * Audit email queue operations
 */

/**
 * Log when team notification email is queued
 */
export async function auditTeamNotificationQueued(
    applicationId: string,
    jobId: string | number,
    companyName: string,
    projectTitle: string
): Promise<void> {
    try {
        await createAuditLog({
            action: 'email_team_notification_queued',
            entityType: 'pending_partner',
            entityId: applicationId, // ✅ UUID from pending_partners table
            details: {
                jobId: String(jobId),
                emailType: 'team-notification',
                companyName,
                projectTitle,
                recipient: process.env.RESEND_TEAM_EMAIL
            },
            riskLevel: 'low'
        });
    } catch (error) {
        logger.error('Failed to audit team notification queued:', error);
    }
}

/**
 * Log when client confirmation email is queued
 */
export async function auditClientConfirmationQueued(
    applicationId: string,
    jobId: string | number,
    email: string,
    fullName: string,
    companyName: string
): Promise<void> {
    try {
        await createAuditLog({
            action: 'email_client_confirmation_queued',
            entityType: 'pending_partner',
            entityId: applicationId, // ✅ UUID from pending_partners table
            details: {
                jobId: String(jobId),
                emailType: 'client-confirmation',
                email, // Store email in details, not entityId
                fullName,
                companyName,
                recipient: email
            },
            riskLevel: 'low'
        });
    } catch (error) {
        logger.error('Failed to audit client confirmation queued:', error);
    }
}

/**
 * Log when team notification email is sent successfully
 */
export async function auditTeamNotificationSent(
    applicationId: string,
    jobId: string | number
): Promise<void> {
    try {
        await createAuditLog({
            action: 'email_team_notification_sent',
            entityType: 'pending_partner',
            entityId: applicationId,
            details: {
                jobId: String(jobId),
                emailType: 'team-notification',
                success: true
            },
            riskLevel: 'low'
        });
    } catch (error) {
        logger.error('Failed to audit team notification sent:', error);
    }
}

/**
 * Log when client confirmation email is sent successfully
 */
export async function auditClientConfirmationSent(
    applicationId: string,
    jobId: string | number,
    email: string
): Promise<void> {
    try {
        await createAuditLog({
            action: 'email_client_confirmation_sent',
            entityType: 'pending_partner',
            entityId: applicationId,
            details: {
                jobId: String(jobId),
                emailType: 'client-confirmation',
                email,
                success: true
            },
            riskLevel: 'low'
        });
    } catch (error) {
        logger.error('Failed to audit client confirmation sent:', error);
    }
}

/**
 * Log when team notification email fails
 */
export async function auditTeamNotificationFailed(
    applicationId: string,
    jobId: string | number,
    error: string,
    attempts: number
): Promise<void> {
    try {
        await createAuditLog({
            action: 'email_team_notification_failed',
            entityType: 'pending_partner',
            entityId: applicationId,
            details: {
                jobId: String(jobId),
                emailType: 'team-notification',
                error,
                attempts,
                success: false
            },
            riskLevel: 'high' // ✅ Email failures are high priority
        });
    } catch (error) {
        logger.error('Failed to audit team notification failure:', error);
    }
}

/**
 * Log when client confirmation email fails
 */
export async function auditClientConfirmationFailed(
    applicationId: string,
    jobId: string | number,
    email: string,
    error: string,
    attempts: number
): Promise<void> {
    try {
        await createAuditLog({
            action: 'email_client_confirmation_failed',
            entityType: 'pending_partner',
            entityId: applicationId,
            details: {
                jobId: String(jobId),
                emailType: 'client-confirmation',
                email,
                error,
                attempts,
                success: false
            },
            riskLevel: 'high' // ✅ Email failures are high priority
        });
    } catch (error) {
        logger.error('Failed to audit client confirmation failure:', error);
    }
}