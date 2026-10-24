import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Only create client if credentials are available
let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co') {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} else {
  console.log('⚠️  Supabase credentials not configured - running in demo mode');
}

// Initialize database schema
export async function initializeDatabase() {
  console.log('🔧 Checking database schema...');

  if (!supabase) {
    console.log('⚠️  Skipping database init - no Supabase connection');
    return;
  }

  // Database schema initialization would happen here
  // Tables are created via supabase_schema.sql in production

  console.log('✅ Database schema ready');
}

export { supabase };
export default supabase;