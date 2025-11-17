import { getFreshSupabase } from '../config/database';
import logger from '../utils/logger';

interface AuditLogEntry {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  details?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Create audit log entry
 * ✅ FIXED: Uses service role to bypass RLS (audit logs are system-level)
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // ✅ FIX: Use getFreshSupabase() with service role - bypasses RLS
    const supabase = getFreshSupabase();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId || null, // ✅ Allow null for pre-auth events
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        request_method: entry.requestMethod,
        request_path: entry.requestPath,
        details: entry.details || {},
        risk_level: entry.riskLevel
      });

    if (error) {
      logger.error('Failed to create audit log:', error);
      // ✅ Don't throw - audit logging should never break the main flow
    } else {
      logger.debug(`Audit log created: ${entry.action}`, {
        userId: entry.userId || 'unauthenticated',
        riskLevel: entry.riskLevel
      });
    }

    // Log high-risk activities to monitoring
    if (entry.riskLevel === 'critical' || entry.riskLevel === 'high') {
      logger.warn('High-risk activity detected:', {
        action: entry.action,
        userId: entry.userId,
        riskLevel: entry.riskLevel,
        details: entry.details
      });
    }
  } catch (error) {
    logger.error('Audit logging failed:', error);
    // ✅ Don't throw - audit logging should never break the main flow
  }
}

/**
 * Log authentication events
 * ✅ FIXED: Now works for email verification (pre-auth) and login/logout (authenticated)
 */
export async function logAuthEvent(
  action: 'login' | 'logout' | 'login_failed' | 'token_refresh' | 'password_reset_request' | 'password_changed',
  userId: string | undefined,
  ipAddress: string,
  userAgent: string,
  details?: Record<string, any>
): Promise<void> {
  const riskLevelMap: Record<typeof action, AuditLogEntry['riskLevel']> = {
    login: 'low',
    logout: 'low',
    login_failed: 'medium',
    token_refresh: 'low',
    password_reset_request: 'medium',
    password_changed: 'high'
  };

  await createAuditLog({
    userId,
    action,
    entityType: 'auth',
    ipAddress,
    userAgent,
    details,
    riskLevel: riskLevelMap[action]
  });
}

/**
 * Log partner management events
 */
export async function logPartnerEvent(
  action: 'application_submitted' | 'application_approved' | 'application_rejected' | 'status_changed',
  userId: string | undefined,
  partnerId: string,
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: 'partner',
    entityId: partnerId,
    ipAddress,
    details,
    riskLevel: action === 'application_approved' ? 'medium' : 'low'
  });
}