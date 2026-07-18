import { createAdminClient } from '@/lib/supabase/admin';
import { MarkdownAdapter, PDFAdapter, DocxAdapter } from '@/lib/export/adapters';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (key: string) => {
    const line = envContent.split('\n').find(l => l.trim().startsWith(`${key}=`));
    return line ? line.split('=')[1].trim().replace(/['"]/g, '') : '';
  };
  
  process.env.NEXT_PUBLIC_SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  process.env.SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  const adminSupabase = createAdminClient();
  const noteId = 'a7be1ad6-23ab-453e-a9fd-0e693082ba6c';
  
  const { data: note, error } = await adminSupabase
    .from('master_notes')
    .select('*, note_sections(*)')
    .eq('id', noteId)
    .single();
    
  if (error || !note) {
    console.error('Note not found:', error);
    return;
  }
  
  const model = {
    title: note.title,
    sections: note.note_sections.sort((a: any, b: any) => a.display_order - b.display_order).map((s: any) => {
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
  
  console.log('Running DOCX Exporter...');
  const docxAdapter = new DocxAdapter();
  const docx = await docxAdapter.transform(model);
  console.log(`✓ DOCX length: ${docx.length} chars.`);
  
  console.log('Running PDF Exporter...');
  const pdfAdapter = new PDFAdapter();
  const pdf = await pdfAdapter.transform(model);
  console.log(`✓ PDF length: ${pdf.length} bytes.`);
}

main().catch(console.error);
