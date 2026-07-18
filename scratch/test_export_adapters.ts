import * as fs from 'fs';
import { MarkdownAdapter, DocxAdapter, PDFAdapter, NotebookViewModel } from '../lib/export/adapters';

const mockViewModel: NotebookViewModel = {
  title: "Periodic Trends & Molecular Bonds",
  sections: [
    {
      heading: "Electronegativity",
      body: `**Definition**:
> Electronegativity is defined as the tendency of an atom to attract shared electron pairs in a chemical bond.

**Key Explanation**:
Electronegativity increases across a period from left to right due to increased effective nuclear charge. Fluorine has the highest value of 4.0.

**Visual Snippet**:
![Formula](https://supabase.co/assets/docA-zeff-crop.png)
*Source: Periodic_Notes.pdf (Page 1)*

**Example**:
> F is more electronegative than Cl

**Important Points**:
- Increases across a period from left to right
- Decreases down a group as atomic size increases`,
      metadata: {
        id: "sec_electronegativity",
        title: "Electronegativity",
        prerequisites: ["Atomic Structure"],
        relatedTopics: ["Effective Nuclear Charge"],
        difficulty: "Medium",
        importanceScore: 9,
        studyIntelligence: {
          coverage: { score: 100, documents: ["Periodic_Notes.pdf"] },
          completeness: { percentage: 100 },
          importance: 9,
          confidence: 8,
          missingPrerequisites: [],
          conflicts: []
        }
      }
    }
  ]
};

async function main() {
  console.log('--- TEST RUNNING ADAPTERS ---');

  // 1. Markdown Adapter
  const mdAdapter = new MarkdownAdapter();
  const mdOutput = await mdAdapter.transform(mockViewModel);
  fs.writeFileSync('scratch/export_output.md', mdOutput, 'utf8');
  console.log('✓ Markdown output generated successfully in scratch/export_output.md');

  // 2. DOCX Adapter
  const docxAdapter = new DocxAdapter();
  const docxOutput = await docxAdapter.transform(mockViewModel);
  fs.writeFileSync('scratch/export_output.doc', docxOutput, 'utf8');
  console.log('✓ DOCX HTML output generated successfully in scratch/export_output.doc');

  // 3. PDF Adapter
  try {
    const pdfAdapter = new PDFAdapter();
    const pdfBuffer = await pdfAdapter.transform(mockViewModel);
    fs.writeFileSync('scratch/export_output.pdf', pdfBuffer);
    console.log('✓ PDF output generated successfully in scratch/export_output.pdf');
  } catch (err) {
    console.error('Failed to run PDF Adapter:', err);
  }
}

main();
