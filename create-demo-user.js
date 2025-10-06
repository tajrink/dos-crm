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

async function createDemoUsers() {
  try {
    console.log('Creating demo users...');

    // Create demo user 1
    console.log('\n1. Creating hello@devsonsteroids.com...');
    const { data: user1, error: error1 } = await supabase.auth.admin.createUser({
      email: 'hello@devsonsteroids.com',
      password: 'password123',
      email_confirm: true
    });

    if (error1) {
      console.error('❌ Failed to create hello@devsonsteroids.com:', error1.message);
    } else {
      console.log('✅ Successfully created hello@devsonsteroids.com');
      console.log('User ID:', user1.user?.id);
    }

    // Create demo user 2
    console.log('\n2. Creating admin@devsonsteroids.com...');
    const { data: user2, error: error2 } = await supabase.auth.admin.createUser({
      email: 'admin@devsonsteroids.com',
      password: 'password123',
      email_confirm: true
    });

    if (error2) {
      console.error('❌ Failed to create admin@devsonsteroids.com:', error2.message);
    } else {
      console.log('✅ Successfully created admin@devsonsteroids.com');
      console.log('User ID:', user2.user?.id);
    }

    console.log('\n✅ Demo user creation completed!');
    console.log('\nYou can now login with:');
    console.log('Email: hello@devsonsteroids.com');
    console.log('Password: password123');
    console.log('\nOr:');
    console.log('Email: admin@devsonsteroids.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  }
}

createDemoUsers();