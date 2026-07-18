import * as path from 'path';
import * as fs from 'fs';
import { AssetResolver } from '@/lib/export/resolver';

import { createAdminClient } from '@/lib/supabase/admin';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (key: string) => {
    const line = envContent.split('\n').find(l => l.trim().startsWith(`${key}=`));
    return line ? line.split('=')[1].trim().replace(/['"]/g, '') : '';
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  const adminSupabase = createAdminClient();
  const storageKey = 'users/d2a79c1a-1de1-43b4-9536-155b4a35a3ad/vaults/860a9a60-7a98-481f-b243-f038e82b9bb5/assets/384bf9e8-068a-44ca-8dc7-011d7bd0f464-0-img-0.jpeg';
  
  const ref = '/temp-crops/users_d2a79c1a-1de1-43b4-9536-155b4a35a3ad_vaults_860a9a60-7a98-481f-b243-f038e82b9bb5_assets_384bf9e8-068a-44ca-8dc7-011d7bd0f464-0-img-0.jpeg';
  console.log('Downloading from Supabase:', storageKey);
  const { data, error } = await adminSupabase.storage.from('assets').download(storageKey);
  if (error) {
    console.error('Download failed:', error);
    return;
  }
  
  const buffer = Buffer.from(await data.arrayBuffer());
  console.log('Downloaded size:', buffer.length, 'bytes');
  
  const resolved = await AssetResolver.resolve(ref);
  console.log('Resolved asset:', resolved ? 'SUCCESS' : 'NULL');
  if (resolved) {
    console.log('Resolved dimensions:', resolved.width, 'x', resolved.height);
    console.log('Resolved content type:', resolved.contentType);
  }
}

main().catch(console.error);
