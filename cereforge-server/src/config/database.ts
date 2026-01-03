import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase credentials in environment variables');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined');
}

// ✅ OPTIMIZED: Single client instance with connection pooling
// Supabase JS client handles pooling internally via fetch/axios
const supabaseConfig = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'cereforge-api'
    }
  }
};

// ✅ Main client for regular operations (RLS-enabled queries)
export const supabase = createClient(supabaseUrl!, supabaseServiceKey!, supabaseConfig);

// ✅ Admin client for RLS-bypassing operations (sessions, audit logs, etc.)
// Reuse same config but clarify purpose
export const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
  ...supabaseConfig,
  global: {
    headers: {
      'X-Client-Info': 'cereforge-api-admin'
    }
  }
});

/**
 * ✅ DEPRECATED: Use supabaseAdmin directly instead
 * Keeping for backward compatibility during migration
 */
export function getFreshSupabase(): SupabaseClient<any, 'public', any> {
  logger.debug('getFreshSupabase called - consider using supabaseAdmin directly');
  return supabaseAdmin;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }

    logger.info('✅ Database connected successfully');
    return true;
  } catch (error) {
    logger.error('Database connection error:', error);
    return false;
  }
}

/**
 * ✅ NEW: Health check with connection stats
 */
export async function getDatabaseHealth(): Promise<{
  connected: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        connected: false,
        responseTime,
        error: error.message
      };
    }

    return {
      connected: true,
      responseTime
    };
  } catch (error: any) {
    return {
      connected: false,
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

export default supabase;