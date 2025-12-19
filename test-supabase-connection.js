// Test Supabase connection
// Run with: node --env-file=.env test-supabase-connection.js
// Or on older Node: node test-supabase-connection.js (will read .env manually)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually if env vars not set
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const envFile = readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_ANON_KEY') supabaseAnonKey = value;
      }
    });
  } catch (err) {
    console.log('❌ Could not read .env file:', err.message);
    process.exit(1);
  }
}

console.log('🔍 Testing Supabase Connection...\n');

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey?.substring(0, 30) + '...');
console.log('Key format:', supabaseAnonKey?.startsWith('sb_publishable_') ? '✅ New publishable key format' : '⚠️  Legacy or unknown format');
console.log('');

// Try to connect
try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('🔌 Attempting to connect to Supabase...\n');
  
  // Try a simple query to test connection
  const { data, error } = await supabase
    .from('waitlist')
    .select('count')
    .limit(1);
  
  if (error) {
    console.log('❌ Connection failed with error:');
    console.log('   Code:', error.code);
    console.log('   Message:', error.message);
    console.log('   Details:', error.details);
    console.log('');
    
    if (error.code === '42P01') {
      console.log('💡 The "waitlist" table doesn\'t exist yet.');
      console.log('   Run the SQL in supabase-setup.sql to create it.');
    } else if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      console.log('💡 This looks like an authentication error.');
      console.log('   Your anon key might be expired or incorrect.');
      console.log('   Get a fresh key from your Supabase dashboard.');
    } else {
      console.log('💡 Check the SUPABASE_FIX_INSTRUCTIONS.md file for help.');
    }
  } else {
    console.log('✅ Successfully connected to Supabase!');
    console.log('   Your credentials are correct.');
    console.log('');
    console.log('Next step: Run the SQL in supabase-setup.sql');
    console.log('to fix the RLS policy issue.');
  }
  
} catch (err) {
  console.log('❌ Unexpected error:');
  console.log(err.message);
  console.log('');
  console.log('💡 Make sure:');
  console.log('   1. Your Supabase project is active (not paused)');
  console.log('   2. You have internet connection');
  console.log('   3. The SUPABASE_URL is correct');
}
