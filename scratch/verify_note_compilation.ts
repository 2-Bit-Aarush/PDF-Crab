import * as fs from 'fs';
import * as path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { AssetResolver } from '@/lib/export/resolver';
import { MarkdownAdapter, PDFAdapter, DocxAdapter } from '@/lib/export/adapters';

async function verifyCompile() {
  console.log('=== STARTING END-TO-END NOTE INTEGRATION & VERIFICATION ===');
  
  // 1. Fetch env variables
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (key: string) => {
    const line = envContent.split('\n').find(l => l.trim().startsWith(`${key}=`));
    return line ? line.split('=')[1].trim().replace(/['"]/g, '') : '';
  };
  
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase configuration in .env.local');
    process.exit(1);
  }
  
  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
  
  const adminSupabase = createAdminClient();
  
  // 2. Setup a completely clean test vault, document, storage item, and ocr_job
  console.log('\nSetting up test vault and seeding a visual document...');
  const { data: profiles } = await adminSupabase.from('profiles').select('id').limit(1);
  if (!profiles || profiles.length === 0) {
    console.error('No profiles found in the database. Please sign up or log in first.');
    process.exit(1);
  }
  const userId = profiles[0].id;

  const { data: vault, error: vaultErr } = await adminSupabase
    .from('vaults')
    .insert({
      name: 'Integration Test Vault',
      owner_id: userId
    })
    .select()
    .single();

  if (vaultErr || !vault) {
    console.error('Failed to create test vault:', vaultErr);
    process.exit(1);
  }

  // Upload a valid 1x1 pixel PNG image to assets bucket
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const pngBuffer = Buffer.from(base64Png, 'base64');
  const storageKey = `users/${userId}/vaults/${vault.id}/assets/verification_crop.png`;

  await adminSupabase.storage.createBucket('assets', { public: true }).catch(() => {});
  const { error: uploadError } = await adminSupabase.storage
    .from('assets')
    .upload(storageKey, pngBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    console.error('Failed to upload crop to Supabase Storage:', uploadError);
    process.exit(1);
  }

  const publicUrl = adminSupabase.storage.from('assets').getPublicUrl(storageKey).data.publicUrl;
  console.log(`✓ Seeded visual crop uploaded to: ${publicUrl}`);

  // Create document
  const { data: document, error: docErr } = await adminSupabase
    .from('documents')
    .insert({
      vault_id: vault.id,
      name: 'chemistry_notes.pdf',
      storage_path: 'mock_path.pdf',
      size: pngBuffer.length,
      mime_type: 'application/pdf',
      page_count: 1,
      checksum: 'mock_checksum_' + Math.random().toString(36).substring(7),
      owner_id: userId
    })
    .select()
    .single();

  if (docErr || !document) {
    console.error('Failed to create test document:', docErr);
    process.exit(1);
  }

  // Insert completed ocr_job containing a visual block that points to the crop
  const blocks = [
    {
      id: 'block_1',
      type: 'text',
      subType: 'Paragraph',
      content: 'Topic: Electronegativity is defined as the relative power of an atom to attract shared electron pairs.',
      coordinates: { x1: 0, y1: 0, x2: 600, y2: 100 },
      pageIndex: 0,
      semanticType: 'Natural Language',
      protectedContent: false
    },
    {
      id: 'block_2',
      type: 'visual',
      subType: 'Formula',
      content: 'Electronegativity decreases down a group and increases across a period: F > O > N > Cl.',
      coordinates: { x1: 0, y1: 120, x2: 600, y2: 300 },
      imageUrl: publicUrl,
      pageIndex: 0,
      semanticType: 'Mathematical Expression',
      protectedContent: true
    }
  ];

  const { error: ocrErr } = await adminSupabase
    .from('ocr_jobs')
    .insert({
      document_id: document.id,
      status: 'completed',
      raw_text: 'Electronegativity decreases down a group and increases across a period.',
      processed_text: JSON.stringify(blocks),
      page_count: 1,
      confidence_score: 95
    });

  if (ocrErr) {
    console.error('Failed to insert ocr_job:', ocrErr);
    process.exit(1);
  }
  console.log('✓ Seeded document OCR layout blocks inserted successfully.');

  // Create Draft Master Note
  const { data: note, error: noteErr } = await adminSupabase
    .from('master_notes')
    .insert({
      vault_id: vault.id,
      title: 'Chemistry Integration Master Note',
      generated: false,
      active: true
    })
    .select()
    .single();

  if (noteErr || !note) {
    console.error('Failed to create draft master note:', noteErr);
    process.exit(1);
  }
  console.log(`✓ Draft Master Note created: "${note.title}" (ID: ${note.id})`);

  // Create compile_jobs record
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
    console.error('Failed to create compile_job:', jobErr);
    process.exit(1);
  }
  console.log(`✓ Compile Job registered: ${job.id}`);

  // Trigger compiler worker endpoint
  console.log('\nTriggering compile job compilation pipeline...');
  const res = await fetch('http://localhost:3000/api/worker/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: job.id, mode: 'notebook' })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Compiler worker HTTP error:', errText);
    process.exit(1);
  }

  const compileResult = await res.json();
  console.log('✓ Compiler returned response:', compileResult);

  // Poll database until completed
  console.log('Waiting for compilation job to finish...');
  let completedJob = null;
  for (let i = 0; i < 40; i++) {
    const { data: jobData } = await adminSupabase
      .from('compile_jobs')
      .select('*')
      .eq('id', job.id)
      .single();
    
    if (jobData && jobData.status === 'completed') {
      completedJob = jobData;
      break;
    } else if (jobData && jobData.status === 'failed') {
      console.error(`❌ Compilation failed internally: ${jobData.error_message}`);
      process.exit(1);
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  if (!completedJob) {
    console.error('❌ Compilation timed out after 60 seconds.');
    process.exit(1);
  }
  console.log('✓ Compilation completed successfully.');

  // Fetch the freshly compiled note sections
  const { data: compiledNote, error: fetchErr } = await adminSupabase
    .from('master_notes')
    .select('*, note_sections(*)')
    .eq('id', note.id)
    .single();

  if (fetchErr || !compiledNote) {
    console.error('Failed to fetch compiled note sections:', fetchErr);
    process.exit(1);
  }

  // Assemble NotebookViewModel
  const model = {
    title: compiledNote.title,
    sections: compiledNote.note_sections.sort((a: any, b: any) => a.display_order - b.display_order).map((s: any) => {
      let metadata = {};
      try {
        if (s.ocr_source) {
          metadata = JSON.parse(s.ocr_source);
        }
      } catch (e) {}
      return {
        heading: s.heading,
        body: s.body,
        metadata
      };
    })
  };
  
  let totalVisualSnippets = 0;
  
  // 3. Perform verification checks on the generated view model & disk files
  console.log('\n--- VERIFYING COMPILED NOTE OUTCOME ---');
  for (const s of model.sections) {
    console.log(`Checking Section: "${s.heading}"`);
    
    // Check markdown body for visual snippet image links
    const imgMatches = [...s.body.matchAll(/!\[(.*?)\]\((.*?)\)/g)];
    for (const match of imgMatches) {
      totalVisualSnippets++;
      const alt = match[1];
      const imageUrl = match[2];
      
      console.log(`  Found Image Link: ![${alt}](${imageUrl})`);
      
      // Verification: image URL must not be relative bare filename like "1.jpeg"
      if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        console.error(`  ❌ FAIL: Image URL in markdown body is a bare filename: "${imageUrl}"`);
        process.exit(1);
      }
      
      // Verification: local file exists if it points to /temp-crops/
      if (imageUrl.startsWith('/temp-crops/')) {
        const localPathOnDisk = path.join(process.cwd(), 'public', imageUrl);
        const exists = fs.existsSync(localPathOnDisk);
        if (!exists) {
          console.error(`  ❌ FAIL: Local cache image file does not exist at: ${localPathOnDisk}`);
          process.exit(1);
        }
        
        const stats = fs.statSync(localPathOnDisk);
        console.log(`  ✓ OK: Local cached image file exists. Size: ${stats.size} bytes`);
        
        // Check image header validity
        const buffer = fs.readFileSync(localPathOnDisk);
        const val = AssetResolver.validateImage(buffer);
        if (!val.valid) {
          console.error(`  ❌ FAIL: Cached file at ${imageUrl} is not a valid image format.`);
          process.exit(1);
        }
        console.log(`  ✓ OK: Image format is valid. Dimensions: ${val.width}x${val.height} (${val.contentType})`);
      }
    }
    
    // Check metadata visualAssets array (for Asset Inspector validation)
    const visualAssets = (s.metadata as any).visualAssets || [];
    for (const va of visualAssets) {
      console.log(`  Metadata Visual Asset properties:`);
      console.log(`    storageKey: ${va.storageKey}`);
      console.log(`    localPath: ${va.localPath}`);
      console.log(`    publicUrl: ${va.publicUrl}`);
      console.log(`    signedUrl: ${va.signedUrl}`);
      console.log(`    dimensions: ${va.width}x${va.height}`);
      
      if (!va.storageKey || !va.localPath || !va.publicUrl || !va.signedUrl || !va.width || !va.height || !va.mimeType) {
        console.error(`  ❌ FAIL: Missing required properties in VisualSnippet object:`, va);
        process.exit(1);
      }
      console.log(`  ✓ OK: All VisualSnippet properties exist and are fully populated.`);
    }
  }
  
  if (totalVisualSnippets === 0) {
    console.error('❌ FAIL: No visual snippets found in the compiled master note sections.');
    process.exit(1);
  }
  
  // 4. Test Export adapters using this note
  console.log('\nRunning Markdown Exporter...');
  const mdAdapter = new MarkdownAdapter();
  const md = await mdAdapter.transform(model);
  console.log(`✓ Markdown export successful. Output length: ${md.length} chars.`);
  
  console.log('\nRunning DOCX Exporter...');
  const docxAdapter = new DocxAdapter();
  const docx = await docxAdapter.transform(model);
  console.log(`✓ DOCX export successful. Output length: ${docx.length} chars.`);
  
  console.log('\nRunning PDF Exporter...');
  const pdfAdapter = new PDFAdapter();
  const pdf = await pdfAdapter.transform(model);
  console.log(`✓ PDF export successful. Output buffer: ${pdf.length} bytes.`);
  
  console.log('\n====================================================');
  console.log('✅ ALL INTEGRATION CHECKS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

verifyCompile().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
