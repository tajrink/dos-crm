// Create test user using service role key
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://recffmvnexvyndydotwv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY2ZmbXZuZXh2eW5keWRvdHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU2NzIzMiwiZXhwIjoyMDc1MTQzMjMyfQ.AeT7JCRfxN2yR129P1YbSpiqRSRj7udKERWyY9SUHGY';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('Creating test user with service role key...');
    
    // First, try to delete existing user if any
    console.log('\n1. Checking for existing user...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === 'admin@devsonsteroids.com');
    
    if (existingUser) {
      console.log('Found existing user, deleting...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error('Error deleting existing user:', deleteError);
      } else {
        console.log('✓ Existing user deleted');
      }
    }
    
    // Create new user
    console.log('\n2. Creating new test user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@devsonsteroids.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (error) {
      console.error('❌ Failed to create user:', error);
    } else {
      console.log('✅ Test user created successfully!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
    }
    
    // Test login with anon key
    console.log('\n3. Testing login with anon key...');
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY2ZmbXZuZXh2eW5keWRvdHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjcyMzIsImV4cCI6MjA3NTE0MzIzMn0.2WRs_xEyTDtyQigsw6syUqgC6ZhEqhf-hTu3c0MOFg0';
    const anonClient = createClient(supabaseUrl, anonKey);
    
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'admin@devsonsteroids.com',
      password: 'password123'
    });
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError);
    } else {
      console.log('✅ Login test successful!');
      console.log('Session created for:', loginData.user.email);
      
      // Sign out
      await anonClient.auth.signOut();
      console.log('✓ Signed out successfully');
    }
    
  } catch (error) {
    console.error('Script failed:', error);
  }
}

createTestUser();