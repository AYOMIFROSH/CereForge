import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Load environment variables first
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase credentials in environment variables');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined');
}

// ✅ CRITICAL FIX: Create a function that returns a fresh client each time
// This prevents ANY auth state caching between requests
export function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    }
  });
}

// ✅ Export the default client for non-auth operations
export const supabase = createSupabaseClient();

// ✅ Export a function to get a fresh client for auth operations
export function getFreshSupabase(): SupabaseClient {
  return createSupabaseClient();
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = getFreshSupabase();
    const { error } = await client
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

export default supabase;