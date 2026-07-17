const fs = require('fs');

async function main() {
  const supabaseUrl = 'https://prjtyfnkskndmsoapity.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByanR5Zm5rc2tuZG1zb2FwaXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA3MTI2MiwiZXhwIjoyMDk5NjQ3MjYyfQ._jutT2D4sJx1ZF7gQ10MuhWfxRs9TwhIyHQrIrRQGUA';
  
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (!res.ok) {
      console.error(`Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      return;
    }
    
    const spec = await res.json();
    fs.writeFileSync('scratch/openapi_spec.json', JSON.stringify(spec, null, 2));
    console.log('OpenAPI spec saved to scratch/openapi_spec.json');
    
    // Log tables and paths
    const paths = Object.keys(spec.paths);
    console.log('Exposed Paths/Tables/Functions:', paths);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

main();
