import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing CRM Database Connection...');
  console.log('=' .repeat(50));

  const tables = [
    'clients',
    'projects', 
    'invoices',
    'employees',
    'features_catalog',
    'budget_categories',
    'budgets',
    'team_requests',
    'payments'
  ];

  let allTestsPassed = true;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTestsPassed = false;
      } else {
        console.log(`✅ ${table}: ${count} records available`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allTestsPassed = false;
    }
  }

  console.log('=' .repeat(50));
  
  if (allTestsPassed) {
    console.log('🎉 All database tables are accessible!');
    console.log('✅ CRM application database setup is complete and functional.');
  } else {
    console.log('⚠️  Some tables have issues that need to be resolved.');
  }

  // Test authentication
  console.log('\n🔐 Testing Authentication...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'hello@devsonsteroids.com',
    password: 'password123'
  });

  if (authError) {
    console.log(`❌ Authentication failed: ${authError.message}`);
  } else {
    console.log('✅ Authentication successful!');
    console.log(`👤 User: ${authData.user.email}`);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Sign out successful');
  }
}

testDatabaseConnection().catch(console.error);