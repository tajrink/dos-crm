// Test login functionality after schema fixes
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
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
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Testing login functionality...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('\n1. Testing auth initialization...');
    const { data: session } = await supabase.auth.getSession();
    console.log('✓ Auth client initialized successfully');
    console.log('Current session:', session.session ? 'Active' : 'None');

    console.log('\n2. Testing login with demo credentials...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@devsonsteroids.com',
      password: 'password123'
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      
      // Test logout
      console.log('\n3. Testing logout...');
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