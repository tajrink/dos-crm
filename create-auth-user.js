// Create test user in Supabase Auth
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
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY2ZmbXZuZXh2eW5keWRvdHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU2NzIzMiwiZXhwIjoyMDc1MTQzMjMyfQ.AeT7JCRfxN2yR129P1YbSpiqRSRj7udKERWyY9SUHGY';

console.log('Creating test user in Supabase Auth...');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('\n1. Creating test user...');
    
    // First, try to delete the user if it exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(user => user.email === 'admin@devsonsteroids.com');
    
    if (existingUser) {
      console.log('Existing user found, deleting...');
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      console.log('✓ Existing user deleted');
    }
    
    // Create new user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@devsonsteroids.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (error) {
      console.error('Error creating user:', error);
      return;
    }
    
    console.log('✓ Test user created successfully!');
    console.log('Email: admin@devsonsteroids.com');
    console.log('Password: password123');
    console.log('User ID:', data.user.id);
    
    console.log('\n2. Testing user login...');
    
    // Test login with regular client
    const supabaseClient = createClient(supabaseUrl, env.VITE_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@devsonsteroids.com',
      password: 'password123'
    });
    
    if (loginError) {
      console.error('Login test failed:', loginError);
    } else {
      console.log('✓ Login test successful!');
      console.log('Session created for:', loginData.user.email);
      
      // Sign out
      await supabaseClient.auth.signOut();
      console.log('✓ Signed out successfully');
    }
    
  } catch (error) {
    console.error('Failed to create test user:', error);
  }
}

createTestUser();