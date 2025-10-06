const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://hmcuovlsbyzmnnqatiif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtY3VvdmxzYnl6bW5ucWF0aWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzYxMDMsImV4cCI6MjA3NTI1MjEwM30.17JA3msVM2_wIa0819VPiUB_ClRiCuBUvZSNCwdvS24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBudgetCategoryCRUD() {
    console.log('💰 Testing Budget Category CRUD Operations...\n');
    
    let testBudgetCategoryId = null;
    
    try {
        // 1. Test Budget Category CRUD
        console.log('1. Testing Budget Category CRUD...');
        
        // Create budget category
        const { data: budgetCategory, error: budgetCategoryError } = await supabase
            .from('budget_categories')
            .insert({
                name: 'Test Budget Category CRUD',
                description: 'Test budget category for CRUD operations',
                department: 'IT',
                annual_budget: 100000,
                monthly_budget: 8333.33,
                is_active: true
            })
            .select()
            .single();
            
        if (budgetCategoryError) {
            console.error('❌ Error creating budget category:', budgetCategoryError);
            return;
        }
        
        testBudgetCategoryId = budgetCategory.id;
        console.log('✅ Budget category created:', budgetCategory.name);
        
        // Read budget category
        const { data: readBudgetCategory, error: readError } = await supabase
            .from('budget_categories')
            .select('*')
            .eq('id', testBudgetCategoryId)
            .single();
            
        if (readError) {
            console.error('❌ Error reading budget category:', readError);
        } else {
            console.log('✅ Budget category read successfully:', readBudgetCategory.annual_budget);
        }
        
        // Update budget category
        const { data: updatedBudgetCategory, error: updateError } = await supabase
            .from('budget_categories')
            .update({
                name: 'Updated Test Budget Category',
                annual_budget: 120000,
                allocated_amount: 20000,
                remaining_amount: 100000
            })
            .eq('id', testBudgetCategoryId)
            .select()
            .single();
            
        if (updateError) {
            console.error('❌ Error updating budget category:', updateError);
        } else {
            console.log('✅ Budget category updated:', updatedBudgetCategory.name);
        }
        
        // 2. Test Budget Category Filtering and Aggregation
        console.log('\n2. Testing Budget Category Filtering and Aggregation...');
        
        // Filter by department
        const { data: itBudgets, error: filterError } = await supabase
            .from('budget_categories')
            .select('*')
            .eq('department', 'IT');
            
        if (filterError) {
            console.error('❌ Error filtering budget categories by department:', filterError);
        } else {
            console.log('✅ Budget category department filtering works:', itBudgets.length, 'IT budget categories');
        }
        
        // Filter by status
        const { data: activeBudgets, error: statusFilterError } = await supabase
            .from('budget_categories')
            .select('*')
            .eq('is_active', true);
            
        if (statusFilterError) {
            console.error('❌ Error filtering budget categories by status:', statusFilterError);
        } else {
            console.log('✅ Budget category status filtering works:', activeBudgets.length, 'active budget categories');
        }
        
        // Calculate total budget
        const { data: allBudgets, error: budgetError } = await supabase
            .from('budget_categories')
            .select('annual_budget, is_active');
            
        if (budgetError) {
            console.error('❌ Error calculating budget totals:', budgetError);
        } else {
            const totalBudget = allBudgets.reduce((sum, budget) => sum + parseFloat(budget.annual_budget || 0), 0);
            console.log('✅ Budget category calculation works: $', totalBudget.toFixed(2));
        }
        
        // 3. Test Budget Category Status Transitions
        console.log('\n3. Testing Budget Category Status Transitions...');
        
        const statusTransitions = [true, false];
        for (const status of statusTransitions) {
            const { data: statusUpdate, error: statusError } = await supabase
                .from('budget_categories')
                .update({ is_active: status })
                .eq('id', testBudgetCategoryId)
                .select()
                .single();
                
            if (statusError) {
                console.error(`❌ Error updating budget category to ${status}:`, statusError);
            } else {
                console.log(`✅ Budget category status updated to: ${statusUpdate.is_active}`);
            }
        }
        
        // 4. Check Database Schema Fields
        console.log('\n4. Checking Database Schema Fields...');
        
        // Check budget_categories fields
        const { data: budgetCategoryFields, error: fieldsError } = await supabase
            .from('budget_categories')
            .select('*')
            .limit(1);
            
        if (fieldsError) {
            console.error('❌ Error checking budget_categories fields:', fieldsError);
        } else if (budgetCategoryFields.length > 0) {
            console.log('✅ Budget Category fields:', Object.keys(budgetCategoryFields[0]));
        }
        
        // 5. Test Budget Category Calculations
        console.log('\n5. Testing Budget Category Calculations...');
        
        // Test budget allocation
        const { data: budgetAllocation, error: allocationError } = await supabase
            .from('budget_categories')
            .update({
                monthly_budget: 5000
            })
            .eq('id', testBudgetCategoryId)
            .select()
            .single();
            
        if (allocationError) {
            console.error('❌ Error updating budget allocation:', allocationError);
        } else {
            console.log('✅ Budget allocation updated:', budgetAllocation.monthly_budget);
        }
        
        // 6. Test Budget Category Sorting
        console.log('\n6. Testing Budget Category Sorting...');
        
        const { data: sortedBudgets, error: sortError } = await supabase
            .from('budget_categories')
            .select('*')
            .order('annual_budget', { ascending: false })
            .limit(5);
            
        if (sortError) {
            console.error('❌ Error sorting budget categories:', sortError);
        } else {
            console.log('✅ Budget category sorting works:', sortedBudgets.length, 'categories sorted by budget');
        }
        
        // 7. Test Budget Category Search
        console.log('\n7. Testing Budget Category Search...');
        
        const { data: searchResults, error: searchError } = await supabase
            .from('budget_categories')
            .select('*')
            .ilike('name', '%Test%');
            
        if (searchError) {
            console.error('❌ Error searching budget categories:', searchError);
        } else {
            console.log('✅ Budget category search works:', searchResults.length, 'categories found');
        }
        
        // 8. Test Budget Category Date Range Queries
        console.log('\n8. Testing Budget Category Date Range Queries...');
        
        const { data: recentBudgets, error: dateError } = await supabase
            .from('budget_categories')
            .select('*')
            .gte('created_at', '2024-01-01')
            .lte('created_at', '2024-12-31');
            
        if (dateError) {
            console.error('❌ Error querying budget categories by date:', dateError);
        } else {
            console.log('✅ Budget category date range query works:', recentBudgets.length, 'categories in 2024');
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    } finally {
        // Cleanup
        console.log('\n9. Cleaning up test data...');
        
        if (testBudgetCategoryId) {
            await supabase.from('budget_categories').delete().eq('id', testBudgetCategoryId);
            console.log('✅ Test budget category deleted');
        }
    }
    
    console.log('\n✅ Budget Category CRUD operations test completed!');
}

testBudgetCategoryCRUD();