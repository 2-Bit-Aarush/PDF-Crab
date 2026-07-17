const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://prjtyfnkskndmsoapity.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByanR5Zm5rc2tuZG1zb2FwaXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNzEyNjIsImV4cCI6MjA5OTY0NzI2Mn0.I7KaX4JIkd-v3uUHLNF3K6vLOH1Cl86sRhDGlwBU3hI';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByanR5Zm5rc2tuZG1zb2FwaXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA3MTI2MiwiZXhwIjoyMDk5NjQ3MjYyfQ._jutT2D4sJx1ZF7gQ10MuhWfxRs9TwhIyHQrIrRQGUA';

// Admin client to manage user & check database bypass-RLS state
const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// User client (standard client)
const userSupabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = `rls-test-select-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  let userId;

  try {
    console.log(`[Step 1] Creating test user ${email} via Admin auth...`);
    const { data: authData, error: signUpError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (signUpError) {
      console.error('Sign up failed:', signUpError);
      return;
    }

    userId = authData.user.id;
    console.log(`[Step 1 SUCCESS] User created in Auth. ID: ${userId}`);

    // Ensure profile exists for FK
    await adminSupabase.from('profiles').insert({
      id: userId,
      email: email,
      full_name: 'Test RLS User'
    });

    console.log(`[Step 2] Authenticating standard client using email/password...`);
    const { data: signInData, error: signInError } = await userSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Sign in failed:', signInError);
      return;
    }
    console.log('[Step 2 SUCCESS] Authenticated successfully.');

    // Create a new client authenticated with the session access token
    const sessionClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`
        }
      }
    });

    // 1. Insert WITHOUT select
    console.log('[EVIDENCE 1] Inserting vault WITHOUT select()...');
    const insertWithoutSelect = await sessionClient
      .from('vaults')
      .insert({
        name: `Vault Test No-Select ${Date.now()}`,
        owner_id: userId
      });

    console.log('Result WITHOUT select():', {
      status: insertWithoutSelect.status,
      statusText: insertWithoutSelect.statusText,
      error: insertWithoutSelect.error
    });

    // 2. Fetch the newly inserted vault using the same session client in a subsequent select query
    console.log('[EVIDENCE 2] Attempting to select/read the inserted vault using the same authenticated sessionClient...');
    const fetchSelect = await sessionClient
      .from('vaults')
      .select('*')
      .eq('owner_id', userId);

    console.log('Result of subsequent SELECT:', {
      status: fetchSelect.status,
      statusText: fetchSelect.statusText,
      error: fetchSelect.error,
      data: fetchSelect.data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    if (userId) {
      console.log(`[Cleanup] Deleting test user ${userId}...`);
      await adminSupabase.auth.admin.deleteUser(userId);
    }
  }
}

main();
