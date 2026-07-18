import * as path from 'path';
import * as fs from 'fs';
import { AssetResolver } from '@/lib/export/resolver';

async function main() {
  const ref = '/temp-crops/users_d2a79c1a-1de1-43b4-9536-155b4a35a3ad_vaults_3ba81ad6-9e1a-4e95-abae-6615dfc5c87e_assets_9b1f2c61-d2ee-45c2-9edc-4eebcad02147-0-equation-5.png';
  
  console.log('process.cwd():', process.cwd());
  const absoluteCrabPath = 'C:\\Users\\DELL\\OneDrive\\Documents\\Projects\\PDF-Crab\\public';
  console.log('absoluteCrabPath exists:', fs.existsSync(absoluteCrabPath));
  
  const localPath = path.join(absoluteCrabPath, ref.replace(/^\//, ''));
  console.log('localPath:', localPath);
  console.log('localPath exists:', fs.existsSync(localPath));
  
  const resolved = await AssetResolver.resolve(ref);
  console.log('Resolved asset:', resolved ? 'SUCCESS' : 'NULL');
}

main().catch(console.error);
