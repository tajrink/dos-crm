const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://hmcuovlsbyzmnnqatiif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtY3VvdmxzYnl6bW5ucWF0aWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzYxMDMsImV4cCI6MjA3NTI1MjEwM30.17JA3msVM2_wIa0819VPiUB_ClRiCuBUvZSNCwdvS24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceCRUD() {
    console.log('🧾 Testing Invoice CRUD Operations and Client Relationships...\n');
    
    let testClientId = null;
    let testInvoiceId = null;
    let testInvoiceItemId = null;
    let testPaymentId = null;
    
    try {
        // 1. Create a test client first (needed for invoice relationships)
        console.log('1. Creating test client...');
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
                name: 'Test Client Invoice',
                company: 'Test Invoice Company',
                email: 'test.invoice@example.com',
                phone: '+1234567890',
                status: 'Active',
                address: '123 Invoice St',
                website: 'https://testinvoice.com',
                proposed_budget: 10000,
                approved_budget: 8000
            })
            .select()
            .single();
            
        if (clientError) {
            console.error('❌ Error creating client:', clientError);
            return;
        }
        
        testClientId = client.id;
        console.log('✅ Client created:', client.name);
        
        // 2. Test Invoice CRUD
        console.log('\n2. Testing Invoice CRUD...');
        
        // Create test invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: 'INV-TEST-001',
            client_id: client.id,
            subtotal: 1000.00,
            tax_rate: 0.10,
            tax_amount: 100.00,
            total_amount: 1100.00,
            due_date: '2024-02-15',
            status: 'Draft',
            terms: 'Net 30',
            issue_date: '2024-01-15',
            notes: 'Test invoice for CRUD operations'
          })
          .select()
          .single();
            
        if (invoiceError) {
            console.error('❌ Error creating invoice:', invoiceError);
            return;
        }
        
        testInvoiceId = invoice.id;
        console.log('✅ Invoice created:', invoice.invoice_number);
        
        // Read invoice
        const { data: readInvoice, error: readError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', testInvoiceId)
            .single();
            
        if (readError) {
            console.error('❌ Error reading invoice:', readError);
        } else {
            console.log('✅ Invoice read successfully:', readInvoice.total_amount);
        }
        
        // Update invoice
        const { data: updatedInvoice, error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'Sent',
                total_amount: 1200.00,
                notes: 'Updated test invoice'
            })
            .eq('id', testInvoiceId)
            .select()
            .single();
            
        if (updateError) {
            console.error('❌ Error updating invoice:', updateError);
        } else {
            console.log('✅ Invoice updated:', updatedInvoice.status);
        }
        
        // 3. Test Invoice Items CRUD
        console.log('\n3. Testing Invoice Items CRUD...');
        
        const { data: invoiceItem, error: itemError } = await supabase
            .from('invoice_items')
            .insert({
                invoice_id: testInvoiceId,
                item_name: 'Test Service',
                description: 'Test Service Item',
                quantity: 2,
                rate: 500.00,
                amount: 1000.00
            })
            .select()
            .single();
            
        if (itemError) {
            console.error('❌ Error creating invoice item:', itemError);
        } else {
            testInvoiceItemId = invoiceItem.id;
            console.log('✅ Invoice item created:', invoiceItem.description);
        }
        
        // 4. Test Payments CRUD
        console.log('\n4. Testing Payments CRUD...');
        
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                invoice_id: testInvoiceId,
                amount: 600.00,
                payment_date: '2024-01-20',
                payment_method: 'bank_transfer',
                notes: 'Partial payment for test invoice'
            })
            .select()
            .single();
            
        if (paymentError) {
            console.error('❌ Error creating payment:', paymentError);
        } else {
            testPaymentId = payment.id;
            console.log('✅ Payment created:', payment.amount);
        }
        
        // 5. Test Client-Invoice Relationships
        console.log('\n5. Testing Client-Invoice Relationships...');
        
        const { data: clientInvoices, error: relationError } = await supabase
            .from('invoices')
            .select('*, clients(name, company)')
            .eq('client_id', testClientId);
            
        if (relationError) {
            console.error('❌ Error testing client-invoice relationships:', relationError);
        } else {
            console.log('✅ Client-Invoice relationship works:', clientInvoices.length, 'invoices found');
            if (clientInvoices.length > 0) {
                console.log('   Client info:', clientInvoices[0].clients?.name);
            }
        }
        
        // 6. Test Invoice-Items Relationships
        console.log('\n6. Testing Invoice-Items Relationships...');
        
        const { data: invoiceWithItems, error: itemsRelationError } = await supabase
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('id', testInvoiceId)
            .single();
            
        if (itemsRelationError) {
            console.error('❌ Error testing invoice-items relationships:', itemsRelationError);
        } else {
            console.log('✅ Invoice-Items relationship works:', invoiceWithItems.invoice_items?.length, 'items found');
        }
        
        // 7. Test Invoice-Payments Relationships
        console.log('\n7. Testing Invoice-Payments Relationships...');
        
        const { data: invoiceWithPayments, error: paymentsRelationError } = await supabase
            .from('invoices')
            .select('*, payments(*)')
            .eq('id', testInvoiceId)
            .single();
            
        if (paymentsRelationError) {
            console.error('❌ Error testing invoice-payments relationships:', paymentsRelationError);
        } else {
            console.log('✅ Invoice-Payments relationship works:', invoiceWithPayments.payments?.length, 'payments found');
        }
        
        // 8. Test Invoice Filtering and Aggregation
        console.log('\n8. Testing Invoice Filtering and Aggregation...');
        
        // Filter by status
        const { data: draftInvoices, error: filterError } = await supabase
            .from('invoices')
            .select('*')
            .eq('status', 'Sent');
            
        if (filterError) {
            console.error('❌ Error filtering invoices by status:', filterError);
        } else {
            console.log('✅ Invoice status filtering works:', draftInvoices.length, 'sent invoices');
        }
        
        // Filter by client
        const { data: clientInvoicesList, error: clientFilterError } = await supabase
            .from('invoices')
            .select('*')
            .eq('client_id', testClientId);
            
        if (clientFilterError) {
            console.error('❌ Error filtering invoices by client:', clientFilterError);
        } else {
            console.log('✅ Invoice client filtering works:', clientInvoicesList.length, 'invoices for test client');
        }
        
        // Calculate total invoice amounts
        const { data: allInvoices, error: totalError } = await supabase
            .from('invoices')
            .select('total_amount, status');
            
        if (totalError) {
            console.error('❌ Error calculating invoice totals:', totalError);
        } else {
            const totalAmount = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
            console.log('✅ Invoice total calculation works: $', totalAmount.toFixed(2));
        }
        
        // 9. Test Invoice Status Transitions
        console.log('\n9. Testing Invoice Status Transitions...');
        
        // Draft -> Sent -> Paid
        const statusTransitions = ['Draft', 'Sent', 'Paid'];
        for (const status of statusTransitions) {
            const { data: statusUpdate, error: statusError } = await supabase
                .from('invoices')
                .update({ status })
                .eq('id', testInvoiceId)
                .select()
                .single();
                
            if (statusError) {
                console.error(`❌ Error updating invoice to ${status}:`, statusError);
            } else {
                console.log(`✅ Invoice status updated to: ${statusUpdate.status}`);
            }
        }
        
        // 10. Check Database Schema Fields
        console.log('\n10. Checking Database Schema Fields...');
        
        // Check invoices fields
        const { data: invoiceFields, error: fieldsError } = await supabase
            .from('invoices')
            .select('*')
            .limit(1);
            
        if (fieldsError) {
            console.error('❌ Error checking invoices fields:', fieldsError);
        } else if (invoiceFields.length > 0) {
            console.log('✅ Invoice fields:', Object.keys(invoiceFields[0]));
        }
        
        // Check invoice_items fields
        const { data: itemFields, error: itemFieldsError } = await supabase
            .from('invoice_items')
            .select('*')
            .limit(1);
            
        if (itemFieldsError) {
            console.error('❌ Error checking invoice_items fields:', itemFieldsError);
        } else if (itemFields.length > 0) {
            console.log('✅ Invoice Items fields:', Object.keys(itemFields[0]));
        }
        
        // Check payments fields
        const { data: paymentFields, error: paymentFieldsError } = await supabase
            .from('payments')
            .select('*')
            .limit(1);
            
        if (paymentFieldsError) {
            console.error('❌ Error checking payments fields:', paymentFieldsError);
        } else if (paymentFields.length > 0) {
            console.log('✅ Payment fields:', Object.keys(paymentFields[0]));
        }
        
        // 11. Test Complex Invoice Queries
        console.log('\n11. Testing Complex Invoice Queries...');
        
        // Get invoices with client and payment information
        const { data: complexQuery, error: complexError } = await supabase
            .from('invoices')
            .select(`
                *,
                clients(name, company, email),
                invoice_items(item_name, description, quantity, rate, amount),
                payments(amount, payment_date, payment_method)
            `)
            .eq('id', testInvoiceId)
            .single();
            
        if (complexError) {
            console.error('❌ Error in complex invoice query:', complexError);
        } else {
            console.log('✅ Complex invoice query works');
            console.log('   Invoice:', complexQuery.invoice_number);
            console.log('   Client:', complexQuery.clients?.name);
            console.log('   Items:', complexQuery.invoice_items?.length);
            console.log('   Payments:', complexQuery.payments?.length);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    } finally {
        // Cleanup
        console.log('\n12. Cleaning up test data...');
        
        if (testPaymentId) {
            await supabase.from('payments').delete().eq('id', testPaymentId);
            console.log('✅ Test payment deleted');
        }
        
        if (testInvoiceItemId) {
            await supabase.from('invoice_items').delete().eq('id', testInvoiceItemId);
            console.log('✅ Test invoice item deleted');
        }
        
        if (testInvoiceId) {
            await supabase.from('invoices').delete().eq('id', testInvoiceId);
            console.log('✅ Test invoice deleted');
        }
        
        if (testClientId) {
            await supabase.from('clients').delete().eq('id', testClientId);
            console.log('✅ Test client deleted');
        }
    }
    
    console.log('\n✅ Invoice CRUD operations and relationships test completed!');
}

testInvoiceCRUD();