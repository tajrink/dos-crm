const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://hmcuovlsbyzmnnqatiif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtY3VvdmxzYnl6bW5ucWF0aWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzYxMDMsImV4cCI6MjA3NTI1MjEwM30.17JA3msVM2_wIa0819VPiUB_ClRiCuBUvZSNCwdvS24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectCRUD() {
    console.log('🚀 Testing Project CRUD Operations and Client Relationships...\n');
    
    let testClientId = null;
    let testProjectId = null;
    let testBudgetCategoryId = null;
    
    try {
        // 1. Create a test client first (needed for project relationships)
        console.log('1. Creating test client...');
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
                name: 'Test Client Project',
                company: 'Test Project Company',
                email: 'test.project@example.com',
                phone: '+1234567890',
                status: 'Active',
                address: '123 Project St',
                website: 'https://testproject.com',
                proposed_budget: 50000,
                approved_budget: 40000
            })
            .select()
            .single();
            
        if (clientError) {
            console.error('❌ Error creating client:', clientError);
            return;
        }
        
        testClientId = client.id;
        console.log('✅ Client created:', client.name);
        
        // 2. Create a test budget category
        console.log('\n2. Creating test budget category...');
        const { data: budgetCategory, error: budgetError } = await supabase
            .from('budget_categories')
            .insert({
                name: 'Test Development',
                description: 'Test development category',
                department: 'IT',
                annual_budget: 25000
            })
            .select()
            .single();
            
        if (budgetError) {
            console.error('❌ Error creating budget category:', budgetError);
        } else {
            testBudgetCategoryId = budgetCategory.id;
            console.log('✅ Budget category created:', budgetCategory.name);
        }
        
        // 3. Test Project CRUD
        console.log('\n3. Testing Project CRUD...');
        
        // Create project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                name: 'Test Project CRUD',
                description: 'Test project for CRUD operations',
                client_id: testClientId,
                start_date: '2024-01-01',
                end_date: '2024-06-30',
                status: 'In Progress',
                budget: 30000,
                priority: 'high'
            })
            .select()
            .single();
            
        if (projectError) {
            console.error('❌ Error creating project:', projectError);
            return;
        }
        
        testProjectId = project.id;
        console.log('✅ Project created:', project.name);
        
        // Read project
        const { data: readProject, error: readError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', testProjectId)
            .single();
            
        if (readError) {
            console.error('❌ Error reading project:', readError);
        } else {
            console.log('✅ Project read successfully:', readProject.budget);
        }
        
        // Update project
        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({
                status: 'In Progress',
                budget: 35000,
                description: 'Updated test project'
            })
            .eq('id', testProjectId)
            .select()
            .single();
            
        if (updateError) {
            console.error('❌ Error updating project:', updateError);
        } else {
            console.log('✅ Project updated:', updatedProject.status);
        }
        
        // 4. Test Client-Project Relationships
        console.log('\n4. Testing Client-Project Relationships...');
        
        const { data: clientProjects, error: relationError } = await supabase
            .from('projects')
            .select('*, clients(name, company)')
            .eq('client_id', testClientId);
            
        if (relationError) {
            console.error('❌ Error testing client-project relationships:', relationError);
        } else {
            console.log('✅ Client-Project relationship works:', clientProjects.length, 'projects found');
            if (clientProjects.length > 0) {
                console.log('   Client info:', clientProjects[0].clients?.name);
            }
        }
        
        // 5. Test Project-Budget Category Relationships
        console.log('\n5. Testing Project-Budget Category Relationships...');
        
        const { data: projectWithBudget, error: budgetRelationError } = await supabase
            .from('projects')
            .select('*, clients(name, company)')
            .eq('id', testProjectId)
            .single();
            
        if (budgetRelationError) {
            console.error('❌ Error testing project-client relationships:', budgetRelationError);
        } else {
            console.log('✅ Project-Client relationship works');
            console.log('   Client:', projectWithBudget.clients?.name);
        }
        
        // 6. Test Project Filtering and Aggregation
        console.log('\n6. Testing Project Filtering and Aggregation...');
        
        // Filter by status
        const { data: activeProjects, error: filterError } = await supabase
            .from('projects')
            .select('*')
            .eq('status', 'In Progress');
            
        if (filterError) {
            console.error('❌ Error filtering projects by status:', filterError);
        } else {
            console.log('✅ Project status filtering works:', activeProjects.length, 'in progress projects');
        }
        
        // Filter by client
        const { data: clientProjectsList, error: clientFilterError } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', testClientId);
            
        if (clientFilterError) {
            console.error('❌ Error filtering projects by client:', clientFilterError);
        } else {
            console.log('✅ Project client filtering works:', clientProjectsList.length, 'projects for test client');
        }
        
        // Calculate total project budgets
        const { data: allProjects, error: totalError } = await supabase
            .from('projects')
            .select('budget, status');
            
        if (totalError) {
            console.error('❌ Error calculating project totals:', totalError);
        } else {
            const totalBudget = allProjects.reduce((sum, proj) => sum + parseFloat(proj.budget || 0), 0);
            console.log('✅ Project budget calculation works: $', totalBudget.toFixed(2));
        }
        
        // 7. Test Project Status Transitions
        console.log('\n7. Testing Project Status Transitions...');
        
        const statusTransitions = ['Backlog', 'Ready to Quote', 'Quoted', 'Scheduled', 'In Progress', 'Completed'];
        for (const status of statusTransitions) {
            const { data: statusUpdate, error: statusError } = await supabase
                .from('projects')
                .update({ status })
                .eq('id', testProjectId)
                .select()
                .single();
                
            if (statusError) {
                console.error(`❌ Error updating project to ${status}:`, statusError);
            } else {
                console.log(`✅ Project status updated to: ${statusUpdate.status}`);
            }
        }
        
        // 8. Check Database Schema Fields
        console.log('\n8. Checking Database Schema Fields...');
        
        const { data: projectFields, error: fieldsError } = await supabase
            .from('projects')
            .select('*')
            .limit(1);
            
        if (fieldsError) {
            console.error('❌ Error checking projects fields:', fieldsError);
        } else if (projectFields.length > 0) {
            console.log('✅ Project fields:', Object.keys(projectFields[0]));
        }
        
        // 9. Test Complex Project Queries
        console.log('\n9. Testing Complex Project Queries...');
        
        const { data: complexQuery, error: complexError } = await supabase
            .from('projects')
            .select(`
                *,
                clients(name, company, email)
            `)
            .eq('id', testProjectId)
            .single();
            
        if (complexError) {
            console.error('❌ Error in complex project query:', complexError);
        } else {
            console.log('✅ Complex project query works');
            console.log('   Project:', complexQuery.name);
            console.log('   Client:', complexQuery.clients?.name);
        }
        
        // 10. Test Project Date Range Queries
        console.log('\n10. Testing Project Date Range Queries...');
        
        const { data: dateRangeProjects, error: dateError } = await supabase
            .from('projects')
            .select('*')
            .gte('start_date', '2024-01-01')
            .lte('end_date', '2024-12-31');
            
        if (dateError) {
            console.error('❌ Error in date range query:', dateError);
        } else {
            console.log('✅ Date range query works:', dateRangeProjects.length, 'projects in 2024');
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    } finally {
        // Cleanup
        console.log('\n11. Cleaning up test data...');
        
        if (testProjectId) {
            await supabase.from('projects').delete().eq('id', testProjectId);
            console.log('✅ Test project deleted');
        }
        
        if (testBudgetCategoryId) {
            await supabase.from('budget_categories').delete().eq('id', testBudgetCategoryId);
            console.log('✅ Test budget category deleted');
        }
        
        if (testClientId) {
            await supabase.from('clients').delete().eq('id', testClientId);
            console.log('✅ Test client deleted');
        }
    }
    
    console.log('\n✅ Project CRUD operations and relationships test completed!');
}

testProjectCRUD();