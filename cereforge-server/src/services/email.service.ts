import { Resend } from 'resend';
import logger from '../utils/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'no-reply@update.cereforge.com';
const TEAM_EMAIL = process.env.RESEND_TEAM_EMAIL || 'team@cereforge.com';

if (!RESEND_API_KEY) {
  logger.error('RESEND_API_KEY not configured');
  throw new Error('RESEND_API_KEY must be defined in environment variables');
}

const resend = new Resend(RESEND_API_KEY);

/**
 * Send welcome email to new partner with credentials
 */
export async function sendPartnerWelcomeEmail(
  email: string,
  partnerName: string,
  temporaryPassword: string
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
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

    if (error) {
      logger.error('Failed to send welcome email:', error);
      return false;
    }

    logger.info(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    return false;
  }
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
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
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

    if (error) {
      logger.error('Failed to send application notification:', error);
      return false;
    }

    logger.info(`Application notification sent for ${data.companyName}`);
    return true;
  } catch (error) {
    logger.error('Error sending application notification:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  try {
    const resetUrl = `${process.env.FRONTEND_PROD_URL || 'https://cereforge.com'}/reset-password?token=${resetToken}`;
    
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
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

    if (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }

    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Send application rejection email
 */
export async function sendApplicationRejectionEmail(
  email: string,
  companyName: string,
  reason: string
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
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

    if (error) {
      logger.error('Failed to send rejection email:', error);
      return false;
    }

    logger.info(`Rejection email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Error sending rejection email:', error);
    return false;
  }
}