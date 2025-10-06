// Test Supabase connection
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

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test basic connection
async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    
    if (error) {
      console.error('Error querying clients table:', error);
    } else {
      console.log('✓ Successfully connected to Supabase and queried clients table');
    }

    console.log('\n2. Testing auth schema access...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error accessing auth schema:', authError);
    } else {
      console.log('✓ Successfully accessed auth schema');
      console.log('Current session:', authData.session ? 'Active session found' : 'No active session');
    }

    console.log('\n3. Testing auth user creation (this should work)...');
    // This is just a test - we won't actually create a user
    console.log('Auth client initialized successfully');
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();