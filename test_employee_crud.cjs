const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://hmcuovlsbyzmnnqatiif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtY3VvdmxzYnl6bW5ucWF0aWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzYxMDMsImV4cCI6MjA3NTI1MjEwM30.17JA3msVM2_wIa0819VPiUB_ClRiCuBUvZSNCwdvS24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmployeeCRUD() {
    console.log('👥 Testing Employee CRUD Operations and Payment Relationships...\n');
    
    let testEmployeeId = null;
    let testPaymentHistoryId = null;
    let testPaymentScheduleId = null;
    
    try {
        // 1. Test Employee CRUD
        console.log('1. Testing Employee CRUD...');
        
        // Create employee
        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .insert({
                name: 'Test Employee CRUD',
                email: 'test.employee@example.com',
                phone: '+1234567890',
                role: 'Developer',
                department: 'IT',
                joining_date: '2024-01-15',
                base_salary: 75000,
                status: 'active',
                address: '123 Employee St',
                emergency_contact: { name: 'Jane Doe', phone: '+0987654321' }
            })
            .select()
            .single();
            
        if (employeeError) {
            console.error('❌ Error creating employee:', employeeError);
            return;
        }
        
        testEmployeeId = employee.id;
        console.log('✅ Employee created:', employee.name);
        
        // Read employee
        const { data: readEmployee, error: readError } = await supabase
            .from('employees')
            .select('*')
            .eq('id', testEmployeeId)
            .single();
            
        if (readError) {
            console.error('❌ Error reading employee:', readError);
        } else {
            console.log('✅ Employee read successfully:', readEmployee.base_salary);
        }
        
        // Update employee
        const { data: updatedEmployee, error: updateError } = await supabase
            .from('employees')
            .update({
                role: 'Senior Developer',
                salary: 85000,
                department: 'Engineering'
            })
            .eq('id', testEmployeeId)
            .select()
            .single();
            
        if (updateError) {
            console.error('❌ Error updating employee:', updateError);
        } else {
            console.log('✅ Employee updated:', updatedEmployee.role);
        }
        
        // 2. Test Payment History CRUD
        console.log('\n2. Testing Payment History CRUD...');
        
        const { data: paymentHistory, error: paymentHistoryError } = await supabase
            .from('payment_history')
            .insert({
                employee_id: testEmployeeId,
                amount: 7500.00,
                payment_date: '2024-01-31',
                payment_type: 'salary',
                description: 'January 2024 salary payment',
                status: 'completed'
            })
            .select()
            .single();
            
        if (paymentHistoryError) {
            console.error('❌ Error creating payment history:', paymentHistoryError);
        } else {
            testPaymentHistoryId = paymentHistory.id;
            console.log('✅ Payment history created:', paymentHistory.amount);
        }
        
        // 3. Test Payment Schedules CRUD
        console.log('\n3. Testing Payment Schedules CRUD...');
        
        const { data: paymentSchedule, error: paymentScheduleError } = await supabase
            .from('payment_schedules')
            .insert({
                employee_id: testEmployeeId,
                amount: 7500.00,
                scheduled_date: '2024-02-29',
                payment_type: 'salary',
                description: 'February 2024 salary payment',
                status: 'pending'
            })
            .select()
            .single();
            
        if (paymentScheduleError) {
            console.error('❌ Error creating payment schedule:', paymentScheduleError);
        } else {
            testPaymentScheduleId = paymentSchedule.id;
            console.log('✅ Payment schedule created:', paymentSchedule.amount);
        }
        
        // 4. Test Employee-Payment Relationships
        console.log('\n4. Testing Employee-Payment Relationships...');
        
        const { data: employeeWithPayments, error: relationError } = await supabase
            .from('employees')
            .select('*, payment_history(*), payment_schedules(*)')
            .eq('id', testEmployeeId)
            .single();
            
        if (relationError) {
            console.error('❌ Error testing employee-payment relationships:', relationError);
        } else {
            console.log('✅ Employee-Payment relationship works');
            console.log('   Payment history records:', employeeWithPayments.payment_history?.length);
            console.log('   Payment schedule records:', employeeWithPayments.payment_schedules?.length);
        }
        
        // 5. Test Employee Filtering and Aggregation
        console.log('\n5. Testing Employee Filtering and Aggregation...');
        
        // Filter by department
        const { data: itEmployees, error: filterError } = await supabase
            .from('employees')
            .select('*')
            .eq('department', 'Engineering');
            
        if (filterError) {
            console.error('❌ Error filtering employees by department:', filterError);
        } else {
            console.log('✅ Employee department filtering works:', itEmployees.length, 'engineering employees');
        }
        
        // Filter by status
        const { data: activeEmployees, error: statusFilterError } = await supabase
            .from('employees')
            .select('*')
            .eq('status', 'active');
            
        if (statusFilterError) {
            console.error('❌ Error filtering employees by status:', statusFilterError);
        } else {
            console.log('✅ Employee status filtering works:', activeEmployees.length, 'active employees');
        }
        
        // Calculate total salary
        const { data: allEmployees, error: salaryError } = await supabase
            .from('employees')
            .select('base_salary, status');
            
        if (salaryError) {
            console.error('❌ Error calculating salary totals:', salaryError);
        } else {
            const totalSalary = allEmployees.reduce((sum, emp) => sum + parseFloat(emp.base_salary || 0), 0);
            console.log('✅ Employee salary calculation works: $', totalSalary.toFixed(2));
        }
        
        // 6. Test Employee Status Transitions
        console.log('\n6. Testing Employee Status Transitions...');
        
        const statusTransitions = ['active', 'inactive', 'on_leave', 'terminated'];
        for (const status of statusTransitions) {
            const { data: statusUpdate, error: statusError } = await supabase
                .from('employees')
                .update({ status })
                .eq('id', testEmployeeId)
                .select()
                .single();
                
            if (statusError) {
                console.error(`❌ Error updating employee to ${status}:`, statusError);
            } else {
                console.log(`✅ Employee status updated to: ${statusUpdate.status}`);
            }
        }
        
        // 7. Check Database Schema Fields
        console.log('\n7. Checking Database Schema Fields...');
        
        // Check employees fields
        const { data: employeeFields, error: fieldsError } = await supabase
            .from('employees')
            .select('*')
            .limit(1);
            
        if (fieldsError) {
            console.error('❌ Error checking employees fields:', fieldsError);
        } else if (employeeFields.length > 0) {
            console.log('✅ Employee fields:', Object.keys(employeeFields[0]));
        }
        
        // Check payment_history fields
        const { data: paymentHistoryFields, error: paymentHistoryFieldsError } = await supabase
            .from('payment_history')
            .select('*')
            .limit(1);
            
        if (paymentHistoryFieldsError) {
            console.error('❌ Error checking payment_history fields:', paymentHistoryFieldsError);
        } else if (paymentHistoryFields.length > 0) {
            console.log('✅ Payment History fields:', Object.keys(paymentHistoryFields[0]));
        }
        
        // Check payment_schedules fields
        const { data: paymentScheduleFields, error: paymentScheduleFieldsError } = await supabase
            .from('payment_schedules')
            .select('*')
            .limit(1);
            
        if (paymentScheduleFieldsError) {
            console.error('❌ Error checking payment_schedules fields:', paymentScheduleFieldsError);
        } else if (paymentScheduleFields.length > 0) {
            console.log('✅ Payment Schedule fields:', Object.keys(paymentScheduleFields[0]));
        }
        
        // 8. Test Complex Employee Queries
        console.log('\n8. Testing Complex Employee Queries...');
        
        const { data: complexQuery, error: complexError } = await supabase
            .from('employees')
            .select(`
                *,
                payment_history(amount, payment_date, payment_method),
                payment_schedules!payment_schedules_employee_id_fkey(amount, scheduled_date, frequency)
            `)
            .eq('id', testEmployeeId)
            .single();
            
        if (complexError) {
            console.error('❌ Error in complex employee query:', complexError);
        } else {
            console.log('✅ Complex employee query works');
            console.log('   Employee:', complexQuery.name);
            console.log('   Payment history:', complexQuery.payment_history?.length);
            console.log('   Payment schedules:', complexQuery.payment_schedules?.length);
        }
        
        // 9. Test Payment Filtering by Employee
        console.log('\n9. Testing Payment Filtering by Employee...');
        
        const { data: employeePayments, error: paymentFilterError } = await supabase
            .from('payment_history')
            .select('*')
            .eq('employee_id', testEmployeeId);
            
        if (paymentFilterError) {
            console.error('❌ Error filtering payments by employee:', paymentFilterError);
        } else {
            console.log('✅ Payment filtering by employee works:', employeePayments.length, 'payments found');
        }
        
        // 10. Test Payment Status Updates
        console.log('\n10. Testing Payment Status Updates...');
        
        if (testPaymentScheduleId) {
            const { data: updatedSchedule, error: scheduleUpdateError } = await supabase
                .from('payment_schedules')
                .update({ status: 'completed' })
                .eq('id', testPaymentScheduleId)
                .select()
                .single();
                
            if (scheduleUpdateError) {
                console.error('❌ Error updating payment schedule status:', scheduleUpdateError);
            } else {
                console.log('✅ Payment schedule status updated:', updatedSchedule.status);
            }
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    } finally {
        // Cleanup
        console.log('\n11. Cleaning up test data...');
        
        if (testPaymentHistoryId) {
            await supabase.from('payment_history').delete().eq('id', testPaymentHistoryId);
            console.log('✅ Test payment history deleted');
        }
        
        if (testPaymentScheduleId) {
            await supabase.from('payment_schedules').delete().eq('id', testPaymentScheduleId);
            console.log('✅ Test payment schedule deleted');
        }
        
        if (testEmployeeId) {
            await supabase.from('employees').delete().eq('id', testEmployeeId);
            console.log('✅ Test employee deleted');
        }
    }
    
    console.log('\n✅ Employee CRUD operations and payment relationships test completed!');
}

testEmployeeCRUD();