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
  const vaultId = '3ba81ad6-9e1a-4e95-abae-6615dfc5c87e';
  
  // Find or create a draft Master Note for this vault
  const { data: notes } = await adminSupabase
    .from('master_notes')
    .select('*')
    .eq('vault_id', vaultId);
    
  let note = notes && notes.length > 0 ? notes[0] : null;
  if (!note) {
    console.log('No master note found, creating one...');
    const { data: newNote, error: createError } = await adminSupabase
      .from('master_notes')
      .insert({
        vault_id: vaultId,
        title: 'Electronegativity & Electron Affinity Notes',
        generated: false,
        active: true
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Failed to create master note:', createError);
      return;
    }
    note = newNote;
  }
  
  console.log(`Compiling Master Note ID: ${note.id}`);
  
  // Register compile job
  const { data: job, error: jobErr } = await adminSupabase
    .from('compile_jobs')
    .insert({
      master_note_id: note.id,
      status: 'queued',
      phase: 'Indexing Sources',
      progress: 0
    })
    .select()
    .single();
    
  if (jobErr || !job) {
    console.error('Failed to create compile job:', jobErr);
    return;
  }
  
  console.log(`Compile Job created: ${job.id}. Triggering compiler...`);
  
  const res = await fetch('http://localhost:3000/api/worker/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: job.id, mode: 'notebook' })
  });
  
  if (!res.ok) {
    const errText = await res.text();
    console.error('Compiler request failed:', errText);
    return;
  }
  
  console.log('Compiler response:', await res.json());
  
  // Poll until complete
  console.log('Polling compile job status...');
  for (let i = 0; i < 40; i++) {
    const { data: jobData } = await adminSupabase
      .from('compile_jobs')
      .select('*')
      .eq('id', job.id)
      .single();
      
    if (jobData && jobData.status === 'completed') {
      console.log('✓ Compilation completed successfully!');
      break;
    } else if (jobData && jobData.status === 'failed') {
      console.error('❌ Compilation failed:', jobData.error_message);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

main().catch(console.error);
