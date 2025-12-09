// src/services/session.cleanup.service.ts
import supabase from '../config/database';
import logger from '../utils/logger';

/**
 * ✅ Clean up expired/inactive sessions
 * Run this daily to prevent database bloat
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    logger.info('🧹 Starting session cleanup...');

    // Delete sessions that expired more than 24 hours ago
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const { data, error } = await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      logger.error('Session cleanup failed:', error);
      return;
    }

    const deletedCount = data?.length || 0;
    logger.info(`✅ Cleaned up ${deletedCount} expired sessions`);

    // Also mark sessions as inactive if expired (but don't delete immediately)
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (updateError) {
      logger.error('Failed to mark sessions as inactive:', updateError);
    } else {
      logger.info('✅ Marked expired sessions as inactive');
    }
  } catch (error) {
    logger.error('Session cleanup error:', error);
  }
}

/**
 * ✅ Start scheduled cleanup (run every 6 hours)
 */
export function startSessionCleanup(): void {
  // Run immediately on startup
  cleanupExpiredSessions();

  // Then run every 6 hours
  setInterval(() => {
    cleanupExpiredSessions();
  }, 6 * 60 * 60 * 1000); // 6 hours

  logger.info('✅ Session cleanup scheduler started (runs every 6 hours)');
}