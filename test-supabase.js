import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function to check data fetching
async function testDataFetching() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');
  
  try {
    // Test clients table
    console.log('\n--- Testing clients table ---');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);
    
    if (clientsError) {
      console.error('Clients error:', clientsError);
    } else {
      console.log('Clients data:', clients);
      console.log('Clients count:', clients?.length || 0);
    }
    
    // Test projects table
    console.log('\n--- Testing projects table ---');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('Projects error:', projectsError);
    } else {
      console.log('Projects data:', projects);
      console.log('Projects count:', projects?.length || 0);
    }
    
    // Test invoices table
    console.log('\n--- Testing invoices table ---');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(5);
    
    if (invoicesError) {
      console.error('Invoices error:', invoicesError);
    } else {
      console.log('Invoices data:', invoices);
      console.log('Invoices count:', invoices?.length || 0);
    }
    
    // Test payments table
    console.log('\n--- Testing payments table ---');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(5);
    
    if (paymentsError) {
      console.error('Payments error:', paymentsError);
    } else {
      console.log('Payments data:', payments);
      console.log('Payments count:', payments?.length || 0);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDataFetching();