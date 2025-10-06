// Check if users exist in auth.users table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables from .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const env = {};

envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Checking auth users...');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('\n1. Testing auth function to check users...');
    
    // Use our test function to check auth users
    const { data, error } = await supabase.rpc('test_auth_access');
    
    if (error) {
      console.error('❌ Function call failed:', error);
    } else {
      console.log('✅ Auth function successful!');
      console.log('Auth users count:', data.auth_users_count);
      console.log('Current role:', data.current_role);
      console.log('Current user:', data.current_user);
    }
    
    console.log('\n2. Testing direct auth session check...');
    
    // Check current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
    } else {
      console.log('✅ Session check successful!');
      console.log('Current session:', sessionData.session ? 'Active' : 'None');
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkUsers();