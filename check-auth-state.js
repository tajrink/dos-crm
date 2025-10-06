import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthState() {
  console.log('=== Auth State Check ===');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session ? 'Active' : 'None');
    console.log('Session error:', sessionError);
    
    if (session) {
      console.log('User email:', session.user.email);
      console.log('User ID:', session.user.id);
      console.log('Session expires at:', new Date(session.expires_at * 1000));
    }
    
    // Try to sign in with the test credentials
    console.log('\n=== Attempting Sign In ===');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'hello@devsonsteroids.com',
      password: 'password123'
    });
    
    if (signInError) {
      console.log('Sign in error:', signInError.message);
    } else {
      console.log('Sign in successful!');
      console.log('User:', signInData.user.email);
      
      // Now test a simple query
      console.log('\n=== Testing Authenticated Query ===');
      const { data: clients, error: queryError } = await supabase
        .from('clients')
        .select('id, name')
        .limit(5);
        
      if (queryError) {
        console.log('Query error:', queryError.message);
      } else {
        console.log('Query successful! Found', clients.length, 'clients');
        console.log('Sample clients:', clients);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAuthState().then(() => {
  console.log('\n=== Auth Check Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Auth check failed:', error);
  process.exit(1);
});