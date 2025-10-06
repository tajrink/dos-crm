// Simple auth test - bypass admin API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://recffmvnexvyndydotwv.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY2ZmbXZuZXh2eW5keWRvdHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjcyMzIsImV4cCI6MjA3NTE0MzIzMn0.2WRs_xEyTDtyQigsw6syUqgC6ZhEqhf-hTu3c0MOFg0';

const supabase = createClient(supabaseUrl, anonKey);

async function testAuth() {
  try {
    console.log('Testing basic auth functionality...');
    
    // Test 1: Check if we can get session (should work)
    console.log('\n1. Testing session access...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session access failed:', sessionError);
      return;
    } else {
      console.log('✅ Session access works');
      console.log('Current session:', sessionData.session ? 'Active' : 'None');
    }
    
    // Test 2: Try to sign up a new user (this should work if auth is properly configured)
    console.log('\n2. Testing user signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError);
    } else {
      console.log('✅ Signup works!');
      console.log('User created:', signupData.user?.email);
      console.log('Confirmation required:', !signupData.user?.email_confirmed_at);
    }
    
    // Test 3: Try to sign in with a known user (if exists)
    console.log('\n3. Testing signin with demo credentials...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: 'admin@devsonsteroids.com',
      password: 'password123'
    });
    
    if (signinError) {
      console.error('❌ Signin failed:', signinError);
      console.log('This is expected if the user doesn\'t exist yet');
    } else {
      console.log('✅ Signin successful!');
      console.log('Signed in as:', signinData.user?.email);
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✓ Signed out');
    }
    
  } catch (error) {
    console.error('Test failed with exception:', error);
  }
}

testAuth();