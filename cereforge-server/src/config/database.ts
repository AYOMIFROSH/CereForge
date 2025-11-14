import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Load environment variables first
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase credentials in environment variables');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined');
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection
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

export default supabase;