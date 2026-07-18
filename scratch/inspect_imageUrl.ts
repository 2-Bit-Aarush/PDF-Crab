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
  const { data: jobs } = await adminSupabase.from('ocr_jobs').select('*');
  for (const job of jobs || []) {
    try {
      const blocks = JSON.parse(job.processed_text || '[]');
      for (const block of blocks) {
        if (block.type === 'visual') {
          console.log(`Document ID: ${job.document_id} | Name: ${block.content}`);
          console.log(`  imageUrl: ${block.imageUrl}`);
        }
      }
    } catch (e) {}
  }
}

main().catch(console.error);
