async function main() {
  const supabaseUrl = 'https://prjtyfnkskndmsoapity.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByanR5Zm5rc2tuZG1zb2FwaXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA3MTI2MiwiZXhwIjoyMDk5NjQ3MjYyfQ._jutT2D4sJx1ZF7gQ10MuhWfxRs9TwhIyHQrIrRQGUA';

  async function tryQuery(path) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    console.log(`Path: ${path} | Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2).slice(0, 1000));
    } else {
      console.log(await res.text());
    }
  }

  await tryQuery('pg_policies');
  await tryQuery('pg_catalog.pg_policies');
}

main();
