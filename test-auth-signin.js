// Test Supabase auth sign in with existing credentials
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

console.log('Testing Supabase auth sign in...');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthSignIn() {
  try {
    console.log('\n1. Testing sign in with test credentials...');
    
    // Try to sign in with test credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@devsonsteroids.com',
      password: 'password123'
    });
    
    if (error) {
      console.error('Sign in error:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✓ Sign in successful!');
      console.log('User:', data.user?.email);
      console.log('Session:', data.session ? 'Active' : 'None');
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✓ Signed out successfully');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuthSignIn();