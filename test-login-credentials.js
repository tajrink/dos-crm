// Test login with demo credentials
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

console.log('Testing login with demo credentials...');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  try {
    console.log('\n1. Testing login with demo credentials...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@devsonsteroids.com',
      password: 'password123'
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Login successful!');
      console.log('User:', data.user?.email);
      console.log('Session:', data.session ? 'Active' : 'None');
      
      // Test logout
      console.log('\n2. Testing logout...');
      const { error: logoutError } = await supabase.auth.signOut();
      
      if (logoutError) {
        console.error('❌ Logout failed:', logoutError.message);
      } else {
        console.log('✅ Logout successful!');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLogin();