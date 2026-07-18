const fs = require('fs');

const miniPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/MediaBox [0 0 595 842]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 46\n>>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(PDF-Crab Health Check) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n307\n%%EOF'
);

async function main() {
  const apiKey = 'IisTO8cdDbmsiQXOMG9j1rHiudzVhxTZ'; // Mistral API Key from .env.local
  
  try {
    console.log('Uploading file to Mistral Files API...');
    const blob = new Blob([miniPdf], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, 'document.pdf');
    formData.append('purpose', 'ocr');

    const uploadRes = await fetch('https://api.mistral.ai/v1/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData
    });

    if (!uploadRes.ok) {
      console.error('Upload failed:', await uploadRes.text());
      return;
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;
    console.log('Uploaded successfully. File ID:', fileId);

    console.log('Running OCR with include_blocks=true and include_image_base64=true...');
    const ocrRes = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'file',
          file_id: fileId
        },
        include_blocks: true,
        include_image_base64: true
      })
    });

    if (!ocrRes.ok) {
      console.error('OCR API failed:', await ocrRes.text());
      return;
    }

    const ocrData = await ocrRes.json();
    fs.writeFileSync('scratch/ocr_response_sample.json', JSON.stringify(ocrData, null, 2));
    console.log('Saved response to scratch/ocr_response_sample.json');

    // Print summary of the structure
    console.log('Number of pages:', ocrData.pages.length);
    const firstPage = ocrData.pages[0];
    console.log('First Page Dimensions:', firstPage.dimensions);
    console.log('First Page Images:', firstPage.images ? firstPage.images.length : 0);
    console.log('First Page Blocks Count:', firstPage.blocks ? firstPage.blocks.length : 0);
    if (firstPage.blocks && firstPage.blocks.length > 0) {
      console.log('First Page Blocks sample:', firstPage.blocks.slice(0, 3).map(b => ({
        type: b.type,
        bbox: b.bbox,
        contentSummary: b.content ? b.content.slice(0, 50) : ''
      })));
    }

    // Cleanup
    await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
