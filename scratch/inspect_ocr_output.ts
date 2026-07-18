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
  console.log('=== OCR JOBS AND EXTRACTED CONTENT ===');
  for (const job of jobs || []) {
    console.log(`Document ID: ${job.document_id}`);
    console.log(`Status: ${job.status}`);
    console.log(`Raw text:`, job.raw_text?.substring(0, 300));
    try {
      const blocks = JSON.parse(job.processed_text || '[]');
      console.log(`Blocks Count: ${blocks.length}`);
      for (const block of blocks) {
        if (block.semanticType !== 'Natural Language' || /Δ|Heg|9D|Vr|reaction|arrow|sigma|pi|μ/i.test(block.content)) {
          console.log(`  Block type=${block.type} semanticType=${block.semanticType} subType=${block.subType}`);
          console.log(`  Content: "${block.content}"`);
        }
      }
    } catch (e) {
      console.log('Failed to parse processed_text JSON:', e);
    }
    console.log('----------------------------------------------------');
  }
}

main().catch(console.error);
