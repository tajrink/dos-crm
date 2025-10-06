import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAllData() {
  console.log('🗑️  Clearing all CRM data...');
  console.log('=' .repeat(50));

  const tables = [
    'payments',
    'invoice_items', 
    'invoices',
    'budgets',
    'budget_expenses',
    'team_requests',
    'salaries',
    'projects',
    'clients',
    'employees'
  ];

  let totalDeleted = 0;

  for (const table of tables) {
    try {
      console.log(`🔄 Clearing ${table}...`);
      
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.log(`❌ Error clearing ${table}: ${error.message}`);
      } else {
        console.log(`✅ Cleared ${table} successfully`);
        totalDeleted++;
      }
    } catch (err) {
      console.log(`❌ Error clearing ${table}: ${err.message}`);
    }
  }

  console.log('=' .repeat(50));
  console.log(`🎉 Data clearing complete! ${totalDeleted}/${tables.length} tables cleared successfully.`);
  
  // Verify tables are empty
  console.log('\n🔍 Verifying tables are empty...');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error checking - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records remaining`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n✨ Database is now clean and ready for fresh data input!');
}

clearAllData().catch(console.error);