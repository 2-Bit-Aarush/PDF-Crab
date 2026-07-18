const { pdfToPng } = require('pdf-to-png-converter');

const miniPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/MediaBox [0 0 595 842]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 46\n>>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(PDF-Crab Health Check) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n307\n%%EOF'
);

async function main() {
  try {
    console.log('Attempting PDF-to-PNG conversion via pdf-to-png-converter...');
    const result = await pdfToPng(miniPdf, {
      viewportScale: 2.0
    });
    console.log('Conversion succeeded! Result pages:', result.length);
    console.log('Page 1 image content length:', result[0].content.length);
  } catch (err) {
    console.error('Conversion failed:', err);
  }
}

main();
