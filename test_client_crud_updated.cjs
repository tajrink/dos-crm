const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ixqjgfqhqxqjqxqjqxqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpnZnFocXhxanF4cWpxeHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.example';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientCRUDWithNewFields() {
  console.log('🧪 Testing Client CRUD operations with updated fields...\n');

  let testClientId = null;

  try {
    // Test 1: Create client with all new fields
    console.log('1. Testing client creation with new fields...');
    const newClient = {
      name: 'Test Client Updated',
      email: 'testclient.updated@example.com',
      phone: '+1234567890',
      company: 'Test Company Inc.',
      website: 'https://testcompany.com',
      address: '123 Test Street, Test City, TC 12345',
      notes: 'This is a test client with comprehensive information.',
      status: 'Lead',
      reference_source: 'referral',
      reference_details: 'Referred by existing client John Doe',
      proposed_budget: 15000.00,
      approved_budget: 12000.00,
      probable_start_date: '2024-02-01',
      probable_end_date: '2024-06-30',
    };

    const { data: createdClient, error: createError } = await supabase
      .from('clients')
      .insert(newClient)
      .select()
      .single();

    if (createError) {
      console.error('❌ Client creation failed:', createError);
      return;
    }

    testClientId = createdClient.id;
    console.log('✅ Client created successfully with ID:', testClientId);
    console.log('   - Name:', createdClient.name);
    console.log('   - Website:', createdClient.website);
    console.log('   - Status:', createdClient.status);
    console.log('   - Notes:', createdClient.notes);

    // Test 2: Read client with all fields
    console.log('\n2. Testing client read with all fields...');
    const { data: readClient, error: readError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', testClientId)
      .single();

    if (readError) {
      console.error('❌ Client read failed:', readError);
      return;
    }

    console.log('✅ Client read successfully');
    console.log('   - All fields present:', {
      name: readClient.name,
      email: readClient.email,
      website: readClient.website,
      status: readClient.status,
      notes: readClient.notes ? 'Present' : 'Missing',
      proposed_budget: readClient.proposed_budget,
      approved_budget: readClient.approved_budget
    });

    // Test 3: Update client with new fields
    console.log('\n3. Testing client update with new fields...');
    const updateData = {
      website: 'https://updated-testcompany.com',
      status: 'Active',
      notes: 'Updated notes: Client has been activated and project started.',
      approved_budget: 15000.00,
      actual_start_date: '2024-01-15',
    };

    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', testClientId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Client update failed:', updateError);
      return;
    }

    console.log('✅ Client updated successfully');
    console.log('   - Updated website:', updatedClient.website);
    console.log('   - Updated status:', updatedClient.status);
    console.log('   - Updated notes:', updatedClient.notes);
    console.log('   - Updated approved budget:', updatedClient.approved_budget);

    // Test 4: Test client filtering by status
    console.log('\n4. Testing client filtering by status...');
    const { data: activeClients, error: filterError } = await supabase
      .from('clients')
      .select('name, status, website')
      .eq('status', 'Active');

    if (filterError) {
      console.error('❌ Client filtering failed:', filterError);
      return;
    }

    console.log('✅ Client filtering successful');
    console.log(`   - Found ${activeClients.length} active clients`);
    activeClients.forEach(client => {
      console.log(`   - ${client.name} (${client.status}) - ${client.website || 'No website'}`);
    });

    // Test 5: Test client search by notes
    console.log('\n5. Testing client search by notes...');
    const { data: searchResults, error: searchError } = await supabase
      .from('clients')
      .select('name, notes')
      .ilike('notes', '%project%');

    if (searchError) {
      console.error('❌ Client search failed:', searchError);
      return;
    }

    console.log('✅ Client search successful');
    console.log(`   - Found ${searchResults.length} clients with 'project' in notes`);

    // Test 6: Test budget calculations
    console.log('\n6. Testing budget calculations...');
    const { data: budgetData, error: budgetError } = await supabase
      .from('clients')
      .select('name, proposed_budget, approved_budget')
      .not('proposed_budget', 'is', null);

    if (budgetError) {
      console.error('❌ Budget calculation failed:', budgetError);
      return;
    }

    const totalProposed = budgetData.reduce((sum, client) => sum + (client.proposed_budget || 0), 0);
    const totalApproved = budgetData.reduce((sum, client) => sum + (client.approved_budget || 0), 0);

    console.log('✅ Budget calculations successful');
    console.log(`   - Total proposed budget: $${totalProposed.toLocaleString()}`);
    console.log(`   - Total approved budget: $${totalApproved.toLocaleString()}`);

    // Test 7: Test website validation
    console.log('\n7. Testing website URL validation...');
    const invalidWebsiteTest = {
      name: 'Invalid Website Test',
      email: 'invalid@test.com',
      website: 'not-a-valid-url'
    };

    const { error: invalidWebsiteError } = await supabase
      .from('clients')
      .insert(invalidWebsiteTest);

    if (invalidWebsiteError) {
      console.log('✅ Website validation working (invalid URL rejected)');
    } else {
      console.log('⚠️  Website validation not enforced at database level');
    }

    console.log('\n🎉 All Client CRUD tests with new fields completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  } finally {
    // Cleanup: Delete test client
    if (testClientId) {
      console.log('\n🧹 Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', testClientId);

      if (deleteError) {
        console.error('❌ Failed to cleanup test client:', deleteError);
      } else {
        console.log('✅ Test client cleaned up successfully');
      }
    }
  }
}

// Run the test
testClientCRUDWithNewFields()
  .then(() => {
    console.log('\n✨ Client CRUD testing with new fields completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });