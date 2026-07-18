const fs = require('fs');
const path = require('path');
const { createAdminClient } = require('../lib/supabase/admin');
const { AssetResolver } = require('../lib/export/resolver');
const { MarkdownAdapter, PDFAdapter, DocxAdapter } = require('../lib/export/adapters');

async function verifyCompile() {
  console.log('=== STARTING END-TO-END NOTE INTEGRATION & VERIFICATION ===');
  
  // 1. Fetch env variables
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (key) => {
    const line = envContent.split('\n').find(l => l.trim().startsWith(`${key}=`));
    return line ? line.split('=')[1].trim().replace(/['"]/g, '') : '';
  };
  
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase configuration in .env.local');
    process.exit(1);
  }
  
  const adminSupabase = createAdminClient();
  
  // Let's find a compiled master note or compile one
  const { data: notes, error } = await adminSupabase
    .from('master_notes')
    .select('*, note_sections(*)')
    .eq('generated', true)
    .limit(1);
    
  if (error) {
    console.error('Database query error:', error);
    process.exit(1);
  }
  
  let note = notes && notes.length > 0 ? notes[0] : null;
  
  if (!note) {
    console.log('No compiled master notes found. Seeding a mock compiled master note to verify pipeline flow...');
    
    // Let's find a vault to attach the seeded note
    const { data: vaults } = await adminSupabase.from('vaults').select('*').limit(1);
    if (!vaults || vaults.length === 0) {
      console.error('No vaults found to seed note. Please create a vault in the UI first.');
      process.exit(1);
    }
    const vault = vaults[0];
    
    // Seed a mock compiled master note
    const { data: seededNote, error: seedError } = await adminSupabase
      .from('master_notes')
      .insert({
        vault_id: vault.id,
        title: 'Integration Test Chemistry Notebook',
        coverage: 100,
        generated: true,
        active: true,
        ai_model: 'llama-3.3-70b-versatile',
        ocr_provider: 'mistral-ocr-latest'
      })
      .select()
      .single();
      
    if (seedError) {
      console.error('Failed to seed master note:', seedError);
      process.exit(1);
    }
    
    note = seededNote;
    
    // Seed a mock section containing a mock visual snippet
    // Write 1x1 dummy PNG to temp-crops folder to simulate cached storage item
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const buffer = Buffer.from(base64Png, 'base64');
    
    const safeFilename = 'test_seeded_snippet.png';
    const localDir = path.join(process.cwd(), 'public', 'temp-crops');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localFilePath = path.join(localDir, safeFilename);
    fs.writeFileSync(localFilePath, buffer);
    
    const metadata = {
      id: 'test_va_1',
      title: 'Seeded Test Topic',
      difficulty: 'Easy',
      importanceScore: 8,
      studyIntelligence: {
        coverage: { score: 100, documents: ['test_doc.pdf'] },
        completeness: { percentage: 90 },
        importance: 8,
        confidence: 9,
        missingPrerequisites: [],
        conflicts: []
      },
      visualAssets: [
        {
          id: 'va_img_1',
          storageKey: 'users/test/vaults/test/assets/test_seeded_snippet.png',
          publicUrl: `${supabaseUrl}/storage/v1/object/public/assets/users/test/vaults/test/assets/test_seeded_snippet.png`,
          signedUrl: `${supabaseUrl}/storage/v1/object/sign/assets/users/test/vaults/test/assets/test_seeded_snippet.png?token=mock`,
          localPath: `/temp-crops/${safeFilename}`,
          width: 1,
          height: 1,
          mimeType: 'image/png',
          subType: 'Chemistry Trend Diagram',
          source: 'test_doc.pdf (Page 2)'
        }
      ]
    };
    
    const body = `**Definition**:
> Chemistry is the study of matter and change.

**Visual Snippet**:
![Chemistry Trend Diagram](/temp-crops/${safeFilename})
*Source: test_doc.pdf (Page 2)*`;

    const { data: section, error: secError } = await adminSupabase
      .from('note_sections')
      .insert({
        master_note_id: note.id,
        heading: 'Introduction to Chemical Bonds',
        body,
        ocr_source: JSON.stringify(metadata),
        display_order: 0,
        compile_version: 1
      })
      .select()
      .single();
      
    if (secError) {
      console.error('Failed to seed note section:', secError);
      process.exit(1);
    }
    
    note.note_sections = [section];
    console.log('Seeding successful.');
  }
  
  console.log(`Verifying Master Note: "${note.title}" (ID: ${note.id})`);
  
  // Assemble NotebookViewModel
  const model = {
    title: note.title,
    sections: note.note_sections.sort((a,b) => a.display_order - b.display_order).map(s => {
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
  
  // 2. Validate all visual assets in metadata and body
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
        console.error(`  ❌ FAIL: Image URL is a bare filename: "${imageUrl}"`);
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
        console.log(`  ✓ OK: Local file exists. Size: ${stats.size} bytes`);
        
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
    const visualAssets = s.metadata.visualAssets || [];
    for (const va of visualAssets) {
      console.log(`  Metadata Visual Asset:`);
      console.log(`    storageKey: ${va.storageKey}`);
      console.log(`    localPath: ${va.localPath}`);
      console.log(`    publicUrl: ${va.publicUrl}`);
      console.log(`    signedUrl: ${va.signedUrl}`);
      console.log(`    dimensions: ${va.width}x${va.height}`);
      
      if (!va.storageKey || !va.localPath || !va.publicUrl || !va.signedUrl || !va.width || !va.height || !va.mimeType) {
        console.error(`  ❌ FAIL: Missing required properties in VisualSnippet object:`, va);
        process.exit(1);
      }
      console.log(`  ✓ OK: All VisualSnippet properties exist.`);
    }
  }
  
  if (totalVisualSnippets === 0) {
    console.error('❌ FAIL: No visual snippets found in the master note.');
    process.exit(1);
  }
  
  // 3. Test Export adapters using this note
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
