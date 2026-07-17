const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://prjtyfnkskndmsoapity.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByanR5Zm5rc2tuZG1zb2FwaXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA3MTI2MiwiZXhwIjoyMDk5NjQ3MjYyfQ._jutT2D4sJx1ZF7gQ10MuhWfxRs9TwhIyHQrIrRQGUA';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  try {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    console.log('Profiles:');
    console.log(profiles);
  } catch (err) {
    console.error('Failed to query profiles:', err);
  }
}

main();
