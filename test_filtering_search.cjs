const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://hmcuovlsbyzmnnqatiif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtY3VvdmxzYnl6bW5ucWF0aWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzYxMDMsImV4cCI6MjA3NTI1MjEwM30.17JA3msVM2_wIa0819VPiUB_ClRiCuBUvZSNCwdvS24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilteringSortingSearch() {
    console.log('🔍 Testing Data Filtering, Sorting, and Search Functionality...\n');
    
    try {
        // 1. Test Employee Filtering, Sorting, and Search
        console.log('1. Testing Employee Operations...');
        
        // Filter by department
        const { data: deptEmployees, error: deptError } = await supabase
            .from('employees')
            .select('*')
            .eq('department', 'Engineering');
            
        if (deptError) {
            console.error('❌ Employee department filter error:', deptError);
        } else {
            console.log('✅ Employee department filtering works:', deptEmployees.length, 'Engineering employees');
        }
        
        // Filter by status
        const { data: activeEmployees, error: statusError } = await supabase
            .from('employees')
            .select('*')
            .eq('status', 'active');
            
        if (statusError) {
            console.error('❌ Employee status filter error:', statusError);
        } else {
            console.log('✅ Employee status filtering works:', activeEmployees.length, 'active employees');
        }
        
        // Search by name (case-insensitive)
        const { data: searchEmployees, error: searchError } = await supabase
            .from('employees')
            .select('*')
            .ilike('name', '%john%');
            
        if (searchError) {
            console.error('❌ Employee name search error:', searchError);
        } else {
            console.log('✅ Employee name search works:', searchEmployees.length, 'employees found with "john"');
        }
        
        // Sort by name
        const { data: sortedEmployees, error: sortError } = await supabase
            .from('employees')
            .select('*')
            .order('name', { ascending: true })
            .limit(5);
            
        if (sortError) {
            console.error('❌ Employee sorting error:', sortError);
        } else {
            console.log('✅ Employee sorting works:', sortedEmployees.map(e => e.name));
        }
        
        // 2. Test Client Filtering, Sorting, and Search
        console.log('\n2. Testing Client Operations...');
        
        // Filter by status
        const { data: activeClients, error: clientStatusError } = await supabase
            .from('clients')
            .select('*')
            .eq('status', 'active');
            
        if (clientStatusError) {
            console.error('❌ Client status filter error:', clientStatusError);
        } else {
            console.log('✅ Client status filtering works:', activeClients.length, 'active clients');
        }
        
        // Search by company name
        const { data: searchClients, error: clientSearchError } = await supabase
            .from('clients')
            .select('*')
            .ilike('company', '%tech%');
            
        if (clientSearchError) {
            console.error('❌ Client company search error:', clientSearchError);
        } else {
            console.log('✅ Client company search works:', searchClients.length, 'clients found with "tech"');
        }
        
        // Sort by company name
        const { data: sortedClients, error: clientSortError } = await supabase
            .from('clients')
            .select('*')
            .order('company', { ascending: true })
            .limit(5);
            
        if (clientSortError) {
            console.error('❌ Client sorting error:', clientSortError);
        } else {
            console.log('✅ Client sorting works:', sortedClients.map(c => c.company));
        }
        
        // 3. Test Project Filtering, Sorting, and Search
        console.log('\n3. Testing Project Operations...');
        
        // Filter by status
        const { data: activeProjects, error: projectStatusError } = await supabase
            .from('projects')
            .select('*')
            .eq('status', 'active');
            
        if (projectStatusError) {
            console.error('❌ Project status filter error:', projectStatusError);
        } else {
            console.log('✅ Project status filtering works:', activeProjects.length, 'active projects');
        }
        
        // Search by project name
        const { data: searchProjects, error: projectSearchError } = await supabase
            .from('projects')
            .select('*')
            .ilike('name', '%web%');
            
        if (projectSearchError) {
            console.error('❌ Project name search error:', projectSearchError);
        } else {
            console.log('✅ Project name search works:', searchProjects.length, 'projects found with "web"');
        }
        
        // Sort by created date
        const { data: sortedProjects, error: projectSortError } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (projectSortError) {
            console.error('❌ Project sorting error:', projectSortError);
        } else {
            console.log('✅ Project sorting works:', sortedProjects.length, 'projects sorted by date');
        }
        
        // 4. Test Invoice Filtering, Sorting, and Search
        console.log('\n4. Testing Invoice Operations...');
        
        // Filter by status
        const { data: paidInvoices, error: invoiceStatusError } = await supabase
            .from('invoices')
            .select('*')
            .eq('status', 'paid');
            
        if (invoiceStatusError) {
            console.error('❌ Invoice status filter error:', invoiceStatusError);
        } else {
            console.log('✅ Invoice status filtering works:', paidInvoices.length, 'paid invoices');
        }
        
        // Filter by amount range
        const { data: highValueInvoices, error: invoiceAmountError } = await supabase
            .from('invoices')
            .select('*')
            .gte('total_amount', 1000);
            
        if (invoiceAmountError) {
            console.error('❌ Invoice amount filter error:', invoiceAmountError);
        } else {
            console.log('✅ Invoice amount filtering works:', highValueInvoices.length, 'invoices >= $1000');
        }
        
        // Sort by total amount
        const { data: sortedInvoices, error: invoiceSortError } = await supabase
            .from('invoices')
            .select('*')
            .order('total_amount', { ascending: false })
            .limit(5);
            
        if (invoiceSortError) {
            console.error('❌ Invoice sorting error:', invoiceSortError);
        } else {
            console.log('✅ Invoice sorting works:', sortedInvoices.map(i => i.total_amount));
        }
        
        // 5. Test Budget Category Filtering and Sorting
        console.log('\n5. Testing Budget Operations...');
        
        // Filter by category type
        const { data: budgetCategories, error: budgetError } = await supabase
            .from('budget_categories')
            .select('*')
            .ilike('name', '%marketing%');
            
        if (budgetError) {
            console.error('❌ Budget category filter error:', budgetError);
        } else {
            console.log('✅ Budget category filtering works:', budgetCategories.length, 'marketing categories');
        }
        
        // Sort by annual budget
        const { data: sortedBudgets, error: budgetSortError } = await supabase
            .from('budget_categories')
            .select('*')
            .order('annual_budget', { ascending: false })
            .limit(5);
            
        if (budgetSortError) {
            console.error('❌ Budget sorting error:', budgetSortError);
        } else {
            console.log('✅ Budget sorting works:', sortedBudgets.map(b => b.annual_budget));
        }
        
        // 6. Test Payment History Filtering and Sorting
        console.log('\n6. Testing Payment History Operations...');
        
        // Filter by payment method
        const { data: bankTransfers, error: paymentMethodError } = await supabase
            .from('payment_history')
            .select('*')
            .eq('payment_method', 'bank_transfer');
            
        if (paymentMethodError) {
            console.error('❌ Payment method filter error:', paymentMethodError);
        } else {
            console.log('✅ Payment method filtering works:', bankTransfers.length, 'bank transfers');
        }
        
        // Filter by date range
        const { data: recentPayments, error: paymentDateError } = await supabase
            .from('payment_history')
            .select('*')
            .gte('payment_date', '2024-01-01');
            
        if (paymentDateError) {
            console.error('❌ Payment date filter error:', paymentDateError);
        } else {
            console.log('✅ Payment date filtering works:', recentPayments.length, 'payments since 2024');
        }
        
        // Sort by amount
        const { data: sortedPayments, error: paymentSortError } = await supabase
            .from('payment_history')
            .select('*')
            .order('amount', { ascending: false })
            .limit(5);
            
        if (paymentSortError) {
            console.error('❌ Payment sorting error:', paymentSortError);
        } else {
            console.log('✅ Payment sorting works:', sortedPayments.map(p => p.amount));
        }
        
        // 7. Test Complex Queries with Joins
        console.log('\n7. Testing Complex Queries with Relationships...');
        
        // Projects with client information
        const { data: projectsWithClients, error: joinError1 } = await supabase
            .from('projects')
            .select('*, clients(company, status)')
            .limit(3);
            
        if (joinError1) {
            console.error('❌ Project-Client join error:', joinError1);
        } else {
            console.log('✅ Project-Client join works:', projectsWithClients.length, 'projects with client info');
        }
        
        // Invoices with client information
        const { data: invoicesWithClients, error: joinError2 } = await supabase
            .from('invoices')
            .select('*, clients(company)')
            .limit(3);
            
        if (joinError2) {
            console.error('❌ Invoice-Client join error:', joinError2);
        } else {
            console.log('✅ Invoice-Client join works:', invoicesWithClients.length, 'invoices with client info');
        }
        
        // Payment history with employee information
        const { data: paymentsWithEmployees, error: joinError3 } = await supabase
            .from('payment_history')
            .select('*, employees(name, department)')
            .limit(3);
            
        if (joinError3) {
            console.error('❌ Payment-Employee join error:', joinError3);
        } else {
            console.log('✅ Payment-Employee join works:', paymentsWithEmployees.length, 'payments with employee info');
        }
        
        // 8. Test Aggregation Functions
        console.log('\n8. Testing Aggregation Functions...');
        
        // Count employees by department
        const { data: employeeCount, error: countError } = await supabase
            .from('employees')
            .select('department')
            .eq('status', 'active');
            
        if (countError) {
            console.error('❌ Employee count error:', countError);
        } else {
            const deptCounts = {};
            employeeCount.forEach(emp => {
                deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
            });
            console.log('✅ Employee count by department:', deptCounts);
        }
        
        // Sum invoice amounts by status
        const { data: invoiceAmounts, error: sumError } = await supabase
            .from('invoices')
            .select('status, total_amount');
            
        if (sumError) {
            console.error('❌ Invoice sum error:', sumError);
        } else {
            const statusSums = {};
            invoiceAmounts.forEach(inv => {
                statusSums[inv.status] = (statusSums[inv.status] || 0) + parseFloat(inv.total_amount || 0);
            });
            console.log('✅ Invoice amounts by status:', statusSums);
        }
        
        // 9. Test Full-Text Search Capabilities
        console.log('\n9. Testing Full-Text Search...');
        
        // Search across multiple employee fields
        const { data: fullTextEmployees, error: fullTextError1 } = await supabase
            .from('employees')
            .select('*')
            .or('name.ilike.%test%,email.ilike.%test%,role.ilike.%test%');
            
        if (fullTextError1) {
            console.error('❌ Employee full-text search error:', fullTextError1);
        } else {
            console.log('✅ Employee full-text search works:', fullTextEmployees.length, 'employees found');
        }
        
        // Search across client fields
        const { data: fullTextClients, error: fullTextError2 } = await supabase
            .from('clients')
            .select('*')
            .or('company.ilike.%tech%,name.ilike.%tech%,email.ilike.%tech%');
            
        if (fullTextError2) {
            console.error('❌ Client full-text search error:', fullTextError2);
        } else {
            console.log('✅ Client full-text search works:', fullTextClients.length, 'clients found');
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
    
    console.log('\n✅ Filtering, Sorting, and Search functionality test completed!');
}

testFilteringSortingSearch();