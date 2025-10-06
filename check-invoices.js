import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  'https://recffmvnexvyndydotwv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY2ZmbXZuZXh2eW5keWRvdHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU2NzIzMiwiZXhwIjoyMDc1MTQzMjMyfQ.AeT7JCRfxN2yR129P1YbSpiqRSRj7udKERWyY9SUHGY'
);

// Check team_requests data
async function checkRequests() {
  try {
    console.log('Checking team_requests table...');
    const { data: requests, error: requestsError } = await supabase
      .from('team_requests')
      .select(`
        *,
        assignee:assignee_id(id, name, role, department)
      `)
      .limit(5);

    if (requestsError) {
      console.error('Error fetching team_requests:', requestsError);
    } else {
      console.log(`Found ${requests.length} team requests:`);
      console.log(requests);
    }

    console.log('\nChecking employees table for requesters/assignees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(3);

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
    } else {
      console.log(`Found ${employees.length} employees:`);
      console.log(employees);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkRequests();