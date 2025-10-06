import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDashboard() {
  console.log('=== Dashboard Debug Test ===');
  
  try {
    console.log('Testing Supabase connection...');
    
    // Test each table individually
    console.log('\n1. Testing clients table:');
    const clientsRes = await supabase.from('clients').select('id');
    console.log('Clients result:', clientsRes);
    console.log('Clients data:', clientsRes.data);
    console.log('Clients error:', clientsRes.error);
    
    console.log('\n2. Testing projects table:');
    const projectsRes = await supabase.from('projects').select('id, status, created_at');
    console.log('Projects result:', projectsRes);
    console.log('Projects data:', projectsRes.data);
    console.log('Projects error:', projectsRes.error);
    
    console.log('\n3. Testing invoices table:');
    const invoicesRes = await supabase.from('invoices').select('id, status, total_amount');
    console.log('Invoices result:', invoicesRes);
    console.log('Invoices data:', invoicesRes.data);
    console.log('Invoices error:', invoicesRes.error);
    
    console.log('\n4. Testing payments table:');
    const paymentsRes = await supabase.from('payments').select('amount, payment_date');
    console.log('Payments result:', paymentsRes);
    console.log('Payments data:', paymentsRes.data);
    console.log('Payments error:', paymentsRes.error);
    
    // Test auth user
    console.log('\n5. Testing auth user:');
    const { data: user, error: userError } = await supabase.auth.getUser();
    console.log('Auth user:', user);
    console.log('Auth error:', userError);
    
    console.log('\n=== Debug Complete ===');
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugDashboard();