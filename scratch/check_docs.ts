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
  const { data: docs } = await adminSupabase.from('documents').select('*');
  console.log('=== DOCUMENTS LIST ===');
  console.log(docs);
}

main().catch(console.error);
