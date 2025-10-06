import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthAndDashboard() {
  console.log('=== Auth & Dashboard Debug ===');
  
  try {
    // Check current session
    console.log('\n1. Checking current session:');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session ? 'Active' : 'None');
    console.log('User:', session?.user?.email || 'No user');
    console.log('Session error:', sessionError);
    
    // Test dashboard query without authentication
    console.log('\n2. Testing dashboard query as anon user:');
    const [clientsRes, projectsRes, invoicesRes, paymentsRes] = await Promise.all([
      supabase.from('clients').select('id'),
      supabase.from('projects').select('id, status, created_at'),
      supabase.from('invoices').select('id, status, total_amount'),
      supabase.from('payments').select('amount, payment_date'),
    ]);
    
    console.log('Clients result:', {
      data: clientsRes.data?.length || 0,
      error: clientsRes.error
    });
    console.log('Projects result:', {
      data: projectsRes.data?.length || 0,
      error: projectsRes.error
    });
    console.log('Invoices result:', {
      data: invoicesRes.data?.length || 0,
      error: invoicesRes.error
    });
    console.log('Payments result:', {
      data: paymentsRes.data?.length || 0,
      error: paymentsRes.error
    });
    
    // If no session, try to sign in
    if (!session) {
      console.log('\n3. Attempting to sign in:');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'hello@devsonsteroids.com',
        password: 'password123'
      });
      
      console.log('Sign in result:', {
        user: signInData.user?.email || 'No user',
        session: signInData.session ? 'Active' : 'None',
        error: signInError
      });
      
      if (signInData.session) {
        console.log('\n4. Testing dashboard query as authenticated user:');
        const [authClientsRes, authProjectsRes, authInvoicesRes, authPaymentsRes] = await Promise.all([
          supabase.from('clients').select('id'),
          supabase.from('projects').select('id, status, created_at'),
          supabase.from('invoices').select('id, status, total_amount'),
          supabase.from('payments').select('amount, payment_date'),
        ]);
        
        console.log('Authenticated Clients result:', {
          data: authClientsRes.data?.length || 0,
          error: authClientsRes.error
        });
        console.log('Authenticated Projects result:', {
          data: authProjectsRes.data?.length || 0,
          error: authProjectsRes.error
        });
        console.log('Authenticated Invoices result:', {
          data: authInvoicesRes.data?.length || 0,
          error: authInvoicesRes.error
        });
        console.log('Authenticated Payments result:', {
          data: authPaymentsRes.data?.length || 0,
          error: authPaymentsRes.error
        });
      }
    }
    
  } catch (error) {
    console.error('Error during auth/dashboard check:', error);
  }
}

checkAuthAndDashboard();