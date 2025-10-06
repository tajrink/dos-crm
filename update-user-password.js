import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtY3VvdmxzYnl6bW5ucWF0aWlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY3NjEwMywiZXhwIjoyMDc1MjUyMTAzfQ._FgRoGv-yxcIgHV59-J2Rry97RLD6h_zREh-xf95eds';

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserPassword() {
  try {
    console.log('🔄 Updating user password...');
    console.log('=' .repeat(50));

    // First, find the user by email
    console.log('1. Finding user by email: hello@devsonsteroids.com');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    const targetUser = users.users.find(user => user.email === 'hello@devsonsteroids.com');
    
    if (!targetUser) {
      console.error('❌ User not found: hello@devsonsteroids.com');
      console.log('Available users:');
      users.users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
      return;
    }

    console.log('✅ User found:', targetUser.email);
    console.log('   User ID:', targetUser.id);

    // Update the user's password
    console.log('\n2. Updating password...');
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      {
        password: 'Inkislife2025'
      }
    );

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message);
      return;
    }

    console.log('✅ Password updated successfully!');
    console.log('   Email:', updatedUser.user.email);
    console.log('   Updated at:', new Date().toISOString());

    // Test the new credentials
    console.log('\n3. Testing new credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'hello@devsonsteroids.com',
      password: 'Inkislife2025'
    });

    if (signInError) {
      console.error('❌ Login test failed:', signInError.message);
    } else {
      console.log('✅ Login test successful!');
      console.log('   Access token received:', signInData.session?.access_token ? 'Yes' : 'No');
      
      // Sign out after test
      await supabase.auth.signOut();
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Password update complete!');
    console.log('New credentials:');
    console.log('  Email: hello@devsonsteroids.com');
    console.log('  Password: Inkislife2025');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the update
updateUserPassword();