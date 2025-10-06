// Test the auth access function we created
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

console.log('Testing auth access function...');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFunction() {
  try {
    console.log('\n1. Testing auth access function...');
    
    // Call our test function
    const { data, error } = await supabase.rpc('test_auth_access');
    
    if (error) {
      console.error('Function call error:', error);
    } else {
      console.log('✓ Function call successful!');
      console.log('Result:', JSON.stringify(data, null, 2));
    }
    
    console.log('\n2. Testing basic table access...');
    
    // Test basic table access
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
    
    if (clientsError) {
      console.error('Clients table error:', clientsError);
    } else {
      console.log('✓ Clients table access successful!');
      console.log('Sample client:', clientsData?.[0] || 'No clients found');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuthFunction();