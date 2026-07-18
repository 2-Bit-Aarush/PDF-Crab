import { createAdminClient } from '@/lib/supabase/admin';
import * as fs from 'fs';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (key: string) => {
    const line = envContent.split('\n').find(l => l.trim().startsWith(`${key}=`));
    return line ? line.split('=')[1].trim().replace(/['"]/g, '') : '';
  };
  
  process.env.NEXT_PUBLIC_SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  const adminSupabase = createAdminClient();
  
  // Find all documents in the active vault
  const { data: docs } = await adminSupabase.from('documents').select('*');
  if (!docs || docs.length === 0) {
    console.error('No documents found in the database.');
    return;
  }
  
  console.log(`Found ${docs.length} documents. Resetting and triggering OCR jobs...`);
  
  for (const doc of docs) {
    // Delete existing ocr_jobs for this document
    await adminSupabase.from('ocr_jobs').delete().eq('document_id', doc.id);
    
    // Create new queued ocr_job
    const { data: job, error: jobErr } = await adminSupabase
      .from('ocr_jobs')
      .insert({
        document_id: doc.id,
        status: 'queued',
        page_count: doc.page_count || 1
      })
      .select()
      .single();
      
    if (jobErr || !job) {
      console.error(`Failed to create OCR job for document ${doc.name}:`, jobErr);
      continue;
    }
    
    console.log(`Created OCR job ${job.id} for document ${doc.name}. Triggering API endpoint...`);
    
    const res = await fetch('http://localhost:3000/api/worker/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`OCR API request failed for ${doc.name}:`, errText);
    } else {
      console.log(`✓ OCR API request triggered successfully for ${doc.name}.`);
    }
  }
}

main().catch(console.error);
