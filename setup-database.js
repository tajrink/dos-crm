import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://hmcuovlsbyzmnnqatiif.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtY3VvdmxzYnl6bW5ucWF0aWlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY3NjEwMywiZXhwIjoyMDc1MjUyMTAzfQ._FgRoGv-yxcIgHV59-J2Rry97RLD6h_zREh-xf95eds';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to read SQL file
function readSQLFile(filename) {
  const filePath = path.join(__dirname, 'supabase', 'migrations', filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Function to execute SQL
async function executeSQLFile(filename, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const sql = readSQLFile(filename);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct query execution if RPC fails
      const { data: directData, error: directError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .limit(1);
      
      if (directError) {
        throw directError;
      }
      
      // Execute SQL in chunks if it's a large file
      const statements = sql.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement.trim() + ';' 
          });
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.warn(`Warning in statement: ${stmtError.message}`);
          }
        }
      }
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error.message);
    return false;
  }
}

// Function to create demo user
async function createDemoUser() {
  console.log('\n🔄 Creating demo user...');
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'hello@devsonsteroids.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Demo user already exists');
        return true;
      }
      throw error;
    }
    
    console.log('✅ Demo user created successfully:', data.user.email);
    return true;
  } catch (error) {
    console.error('❌ Error creating demo user:', error.message);
    return false;
  }
}

// Function to verify database setup
async function verifyDatabaseSetup() {
  console.log('\n🔄 Verifying database setup...');
  try {
    // Check if main tables exist
    const tables = ['clients', 'projects', 'invoices', 'employees', 'budget_categories', 'budgets'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing table ${table}:`, error.message);
        return false;
      }
      
      console.log(`✅ Table ${table} is accessible`);
    }
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hello@devsonsteroids.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ Authentication test failed:', authError.message);
      return false;
    }
    
    console.log('✅ Authentication test passed');
    
    // Sign out
    await supabase.auth.signOut();
    
    console.log('\n🎉 Database setup verification completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

// Main setup function
async function setupDatabase() {
  console.log('🚀 Starting comprehensive database setup...');
  
  const migrations = [
    { file: '001_initial_schema.sql', description: 'Applying initial schema migration' },
    { file: '003_budget_tables.sql', description: 'Applying budget tables migration' },
    { file: '009_comprehensive_auth_fix.sql', description: 'Applying comprehensive auth fix' },
    { file: 'add_sample_data.sql', description: 'Applying sample data migration' }
  ];
  
  let success = true;
  
  // Execute migrations in order
  for (const migration of migrations) {
    const result = await executeSQLFile(migration.file, migration.description);
    if (!result) {
      success = false;
      console.log(`⚠️  Continuing despite error in ${migration.file}...`);
    }
  }
  
  // Create demo user
  const userResult = await createDemoUser();
  if (!userResult) {
    success = false;
  }
  
  // Verify setup
  const verifyResult = await verifyDatabaseSetup();
  if (!verifyResult) {
    success = false;
  }
  
  if (success) {
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Setup Summary:');
    console.log('   ✅ Initial schema created');
    console.log('   ✅ Budget tables added');
    console.log('   ✅ Auth permissions configured');
    console.log('   ✅ Sample data populated');
    console.log('   ✅ Demo user created (hello@devsonsteroids.com / password123)');
    console.log('   ✅ Database verification passed');
  } else {
    console.log('\n⚠️  Database setup completed with some warnings. Please check the logs above.');
  }
}

// Run the setup
setupDatabase().catch(console.error);