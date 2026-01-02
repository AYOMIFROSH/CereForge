// src/services/email.service.ts - REFACTORED WITHOUT QUEUE
import { Resend } from 'resend';
import logger from '../utils/logger';
import { createAuditLog } from './audit.service';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'no-reply@update.cereforge.com';
const TEAM_EMAIL = process.env.RESEND_TEAM_EMAIL || 'cereforgepurpose@gmail.com';

if (!RESEND_API_KEY) {
  logger.error('RESEND_API_KEY not configured');
  throw new Error('RESEND_API_KEY must be defined in environment variables');
}

const resend = new Resend(RESEND_API_KEY);

// =====================================================
// TYPES
// =====================================================

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorType?: 'permanent' | 'transient';
  attempts: number;
}

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000, // Start with 1 second
  backoffMultiplier: 2 // Double delay each retry (1s, 2s, 4s)
};

// =====================================================
// HELPER: RETRY WITH EXPONENTIAL BACKOFF
// =====================================================

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTransientError(error: any): boolean {
  // Transient errors that should be retried
  const transientCodes = [429, 500, 502, 503, 504];
  const transientMessages = [
    'rate limit',
    'timeout',
    'network',
    'temporarily unavailable',
    'try again'
  ];

  // Check HTTP status code
  if (error?.statusCode && transientCodes.includes(error.statusCode)) {
    return true;
  }

  // Check error message
  const errorMsg = (error?.message || '').toLowerCase();
  return transientMessages.some(msg => errorMsg.includes(msg));
}

async function sendWithRetry(
  sendFn: () => Promise<any>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<EmailResult> {
  let lastError: any;
  let currentDelay = config.delayMs;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await sendFn();
      
      // Success
      return {
        success: true,
        messageId: result.data?.id || result.id,
        attempts: attempt
      };
    } catch (error: any) {
      lastError = error;
      
      // Check if error is transient
      const isTransient = isTransientError(error);
      
      // Log retry attempt
      logger.warn(`Email send attempt ${attempt}/${config.maxRetries} failed:`, {
        error: error.message,
        statusCode: error.statusCode,
        isTransient,
        willRetry: isTransient && attempt < config.maxRetries
      });

      // If permanent error, stop immediately
      if (!isTransient) {
        return {
          success: false,
          error: error.message || 'Unknown error',
          errorType: 'permanent',
          attempts: attempt
        };
      }

      // If transient and not last attempt, wait and retry
      if (attempt < config.maxRetries) {
        await delay(currentDelay);
        currentDelay *= config.backoffMultiplier;
      }
    }
  }

  // Max retries exceeded
  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded',
    errorType: 'transient',
    attempts: config.maxRetries
  };
}

// =====================================================
// AUDIT LOGGING HELPERS
// =====================================================

async function logEmailSuccess(
  emailType: string,
  recipient: string,
  messageId: string,
  attempts: number,
  entityId?: string
): Promise<void> {
  await createAuditLog({
    action: 'email_sent',
    entityType: 'email',
    entityId: entityId || messageId,
    details: {
      emailType,
      recipient,
      messageId,
      attempts,
      status: 'delivered'
    },
    riskLevel: 'low'
  });
}

async function logEmailFailure(
  emailType: string,
  recipient: string,
  error: string,
  errorType: 'permanent' | 'transient',
  attempts: number,
  entityId?: string
): Promise<void> {
  await createAuditLog({
    action: errorType === 'permanent' ? 'email_failed_permanent' : 'email_failed_max_retries',
    entityType: 'email',
    entityId,
    details: {
      emailType,
      recipient,
      error,
      errorType,
      attempts,
      status: 'failed'
    },
    riskLevel: errorType === 'permanent' ? 'medium' : 'high'
  });
}

// =====================================================
// EMAIL FUNCTIONS
// =====================================================

/**
 * Send partner welcome email with credentials
 */
export async function sendPartnerWelcomeEmail(
  email: string,
  partnerName: string,
  temporaryPassword: string,
  partnerId?: string
): Promise<boolean> {
  const result = await sendWithRetry(async () => {
    return await resend.emails.send({
      from: `Cereforge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to Cereforge - Your Account Details',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Cereforge!</h1>
              <p>Your Partnership Account is Ready</p>
            </div>
            <div class="content">
              <p>Hello <strong>${partnerName}</strong>,</p>
              
              <p>We're excited to have you as a Cereforge partner! Your account has been approved and is now active.</p>
              
              <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px;">${temporaryPassword}</code></p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This is a temporary password. You'll be required to change it on your first login.
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_PROD_URL || 'https://cereforge.com'}/login" class="button">
                  Login to Your Dashboard
                </a>
              </div>
              
              <h3>Next Steps:</h3>
              <ol>
                <li>Click the button above to access your dashboard</li>
                <li>Login with your email and temporary password</li>
                <li>Set a new secure password</li>
                <li>Complete your profile setup</li>
                <li>Start exploring your partner portal</li>
              </ol>
              
              <p>If you have any questions or need assistance, our team is here to help!</p>
              
              <p>Best regards,<br><strong>The Cereforge Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 Cereforge. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  });

  // Audit logging
  if (result.success) {
    logger.info(`Welcome email sent to ${email} (${result.attempts} attempts)`);
    await logEmailSuccess('partner_welcome', email, result.messageId!, result.attempts, partnerId);
  } else {
    logger.error(`Failed to send welcome email to ${email}: ${result.error}`);
    await logEmailFailure('partner_welcome', email, result.error!, result.errorType!, result.attempts, partnerId);
  }

  return result.success;
}

/**
 * Send notification to team about new partner application
 */
export async function sendPartnerApplicationNotification(data: {
  fullName: string;
  email: string;
  companyName: string;
  projectTitle: string;
  applicationId: string;
}): Promise<boolean> {
  const result = await sendWithRetry(async () => {
    return await resend.emails.send({
      from: `Cereforge <${FROM_EMAIL}>`,
      to: TEAM_EMAIL,
      subject: `New Partner Application - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Partner Application</h1>
            </div>
            <div class="content">
              <p>A new partner has submitted an application and is awaiting review.</p>
              
              <div class="info-box">
                <h3>Applicant Details:</h3>
                <p><strong>Name:</strong> ${data.fullName}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Company:</strong> ${data.companyName}</p>
                <p><strong>Project:</strong> ${data.projectTitle}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_PROD_URL || 'https://cereforge.com'}/admin/pending-partners/${data.applicationId}" class="button">
                  Review Application
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Please review this application at your earliest convenience.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  });

  // Audit logging
  if (result.success) {
    logger.info(`Application notification sent for ${data.companyName}`);
    await logEmailSuccess('partner_application', TEAM_EMAIL, result.messageId!, result.attempts, data.applicationId);
  } else {
    logger.error(`Failed to send application notification: ${result.error}`);
    await logEmailFailure('partner_application', TEAM_EMAIL, result.error!, result.errorType!, result.attempts, data.applicationId);
  }

  return result.success;
}

/**
 * Send confirmation email to client
 */
export async function sendClientConfirmationEmail(
  email: string,
  fullName: string,
  companyName: string,
  projectTitle: string,
  applicationId?: string
): Promise<boolean> {
  const result = await sendWithRetry(async () => {
    return await resend.emails.send({
      from: `Cereforge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Application Received - Cereforge',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      
                      <!-- Checkmark using table for perfect centering -->
                      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 20px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #10b981; width: 80px; height: 80px; border-radius: 50%; color: white; font-size: 48px; font-weight: bold; line-height: 80px;">
                            ✓
                          </td>
                        </tr>
                      </table>
                      
                      <h1 style="margin: 0; font-size: 28px;">Application Received!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                      
                      <p>Hello <strong>${fullName}</strong>,</p>
                      
                      <p>Thank you for your interest in partnering with Cereforge! We've successfully received your project application.</p>
                      
                      <!-- Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                        <tr>
                          <td>
                            <h3 style="color: #1e3a8a; margin-top: 0;">Application Summary:</h3>
                            <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
                            <p style="margin: 5px 0;"><strong>Project:</strong> ${projectTitle}</p>
                            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</p>
                          </td>
                        </tr>
                      </table>
                      
                      <h3 style="color: #1e3a8a;">What Happens Next?</h3>
                      <ol style="padding-left: 20px;">
                        <li style="margin-bottom: 10px;"><strong>Review (24-48 hours):</strong> Our team will carefully review your application</li>
                        <li style="margin-bottom: 10px;"><strong>Initial Contact:</strong> We'll reach out via email or phone</li>
                        <li style="margin-bottom: 10px;"><strong>Discovery Call:</strong> If aligned, we'll schedule a detailed discussion</li>
                        <li style="margin-bottom: 10px;"><strong>Proposal:</strong> We'll craft a tailored solution for your project</li>
                      </ol>
                      
                      <p>We're excited about the possibility of bringing your vision to life with cutting-edge AI and engineering solutions.</p>
                      
                      <p>If you have any immediate questions, feel free to reply to this email or contact us at <a href="mailto:cereforgepurpose@gmail.com" style="color: #3b82f6; text-decoration: none;">cereforgepurpose@gmail.com</a>.</p>
                      
                      <p>Best regards,<br><strong>The Cereforge Team</strong></p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="text-align: center; color: #6b7280; font-size: 12px; padding: 30px 20px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Cereforge. All rights reserved.</p>
                      <p style="margin: 5px 0;">Innovative AI & Engineering Solutions</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });
  });

  // Audit logging
  if (result.success) {
    logger.info(`Client confirmation sent to ${email}`);
    await logEmailSuccess('client_confirmation', email, result.messageId!, result.attempts, applicationId);
  } else {
    logger.error(`Failed to send client confirmation: ${result.error}`);
    await logEmailFailure('client_confirmation', email, result.error!, result.errorType!, result.attempts, applicationId);
  }

  return result.success;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userId?: string
): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_PROD_URL || 'https://cereforge.com'}/reset-password?token=${resetToken}`;

  const result = await sendWithRetry(async () => {
    return await resend.emails.send({
      from: `Cereforge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Reset Your Cereforge Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>You requested to reset your Cereforge password.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  });

  // Audit logging
  if (result.success) {
    logger.info(`Password reset email sent to ${email}`);
    await logEmailSuccess('password_reset', email, result.messageId!, result.attempts, userId);
  } else {
    logger.error(`Failed to send password reset: ${result.error}`);
    await logEmailFailure('password_reset', email, result.error!, result.errorType!, result.attempts, userId);
  }

  return result.success;
}

/**
 * Send application rejection email
 */
export async function sendApplicationRejectionEmail(
  email: string,
  companyName: string,
  reason: string,
  applicationId?: string
): Promise<boolean> {
  const result = await sendWithRetry(async () => {
    return await resend.emails.send({
      from: `Cereforge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Update on Your Cereforge Application',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Update</h1>
            </div>
            <div class="content">
              <p>Hello ${companyName},</p>
              
              <p>Thank you for your interest in partnering with Cereforge.</p>
              
              <p>After careful review, we're unable to proceed with your application at this time.</p>
              
              <p><strong>Reason:</strong> ${reason}</p>
              
              <p>We appreciate the time you took to apply and encourage you to reapply in the future if circumstances change.</p>
              
              <p>Best regards,<br><strong>The Cereforge Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  });

  // Audit logging
  if (result.success) {
    logger.info(`Rejection email sent to ${email}`);
    await logEmailSuccess('application_rejection', email, result.messageId!, result.attempts, applicationId);
  } else {
    logger.error(`Failed to send rejection email: ${result.error}`);
    await logEmailFailure('application_rejection', email, result.error!, result.errorType!, result.attempts, applicationId);
  }

  return result.success;
}