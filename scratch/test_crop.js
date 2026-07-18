const { PDFDocument } = require('pdf-lib');
const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs');

const miniPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/MediaBox [0 0 595 842]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 46\n>>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(PDF-Crab Health Check) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n307\n%%EOF'
);

async function main() {
  try {
    console.log('Loading miniPdf into pdf-lib...');
    const pdfDoc = await PDFDocument.load(miniPdf);
    
    console.log('Creating new document for crop...');
    const croppedDoc = await PDFDocument.create();
    const [copiedPage] = await croppedDoc.copyPages(pdfDoc, [0]);
    croppedDoc.addPage(copiedPage);
    
    // Page dimensions
    const { width: pdfWidth, height: pdfHeight } = copiedPage.getSize();
    console.log(`Original Page Size: ${pdfWidth}x${pdfHeight}`);

    // Crop box coordinates
    // Let's crop the text area "PDF-Crab Health Check" which is at bottom-left in PDF coordinates
    // but top-left in standard view. Let's crop x: 50-300, y: 650-750
    copiedPage.setCropBox(50, 650, 250, 100);
    copiedPage.setMediaBox(50, 650, 250, 100);

    console.log('Saving cropped document...');
    const savedPdfBytes = await croppedDoc.save();
    
    console.log('Converting cropped PDF page to PNG...');
    const pngPages = await pdfToPng(Buffer.from(savedPdfBytes), {
      viewportScale: 3.0
    });
    
    console.log('PNG generated successfully! Size in bytes:', pngPages[0].content.length);
    fs.writeFileSync('scratch/test_crop_output.png', pngPages[0].content);
    console.log('Saved image to scratch/test_crop_output.png');
  } catch (err) {
    console.error('Error during crop/render test:', err);
  }
}

main();
