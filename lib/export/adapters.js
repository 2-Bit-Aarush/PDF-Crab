"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFAdapter = exports.DocxAdapter = exports.MarkdownAdapter = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
function fetchImageBuffer(imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const isSupabaseUrl = imageUrl.includes('supabase.co/storage/v1/object/');
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const headers = {};
                if (isSupabaseUrl && serviceRoleKey) {
                    headers['apikey'] = serviceRoleKey;
                    headers['Authorization'] = `Bearer ${serviceRoleKey}`;
                }
                const res = yield fetch(imageUrl, { headers });
                if (res.ok) {
                    return Buffer.from(yield res.arrayBuffer());
                }
                throw new Error(`HTTP status ${res.status}`);
            }
            catch (err) {
                if (attempt === 3)
                    throw err;
                yield new Promise(resolve => setTimeout(resolve, attempt * 500));
            }
        }
        throw new Error('Failed to fetch image buffer after all retries');
    });
}
// Markdown Adapter
class MarkdownAdapter {
    transform(model) {
        return __awaiter(this, void 0, void 0, function* () {
            let output = `# ${model.title}\n\n`;
            for (const section of model.sections) {
                output += `## ${section.heading}\n\n${section.body}\n\n`;
                if (section.metadata) {
                    output += `### Study Metadata\n`;
                    const si = section.metadata.studyIntelligence;
                    if (si) {
                        output += `- **Completeness**: ${si.completeness.percentage}%\n`;
                        output += `- **Confidence**: ${si.confidence}/10\n`;
                        if (si.missingPrerequisites.length > 0) {
                            output += `- **Missing Prerequisites**: ${si.missingPrerequisites.join(', ')}\n`;
                        }
                        if (si.conflicts.length > 0) {
                            output += `- **Conflicts Detected**: ${si.conflicts.join('; ')}\n`;
                        }
                    }
                    output += `\n`;
                }
                output += `---\n\n`;
            }
            return output;
        });
    }
}
exports.MarkdownAdapter = MarkdownAdapter;
// DOCX Adapter (Generates a clean, styles-enriched MS Word HTML payload)
class DocxAdapter {
    transform(model) {
        return __awaiter(this, void 0, void 0, function* () {
            let sectionsHtml = '';
            for (const section of model.sections) {
                // Basic markdown to html replacement for Word compatibility
                let htmlBody = section.body
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*Definition\*\*:/g, '<strong>Definition:</strong>')
                    .replace(/\*\*Key Explanation\*\*:/g, '<strong>Key Explanation:</strong>')
                    .replace(/\*\*Visual Snippet\*\*:/g, '<strong>Visual Snippet:</strong>')
                    .replace(/\*\*Example\*\*:/g, '<strong>Example:</strong>')
                    .replace(/\*\*Important Points\*\*:/g, '<strong>Important Points:</strong>')
                    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 500px; display: block; margin: 10px 0;"><br>');
                sectionsHtml += `
        <h2 style="font-size: 18pt; color: #1e3a8a; margin-top: 24pt; page-break-before: always;">${section.heading}</h2>
        <div style="font-size: 11pt; color: #333333; line-height: 1.5;">
          ${htmlBody}
        </div>
      `;
            }
            return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
      <meta charset="utf-8">
      <title>${model.title}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.6; margin: 1in; }
        h1 { color: #1e3a8a; font-size: 24pt; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; }
        strong { color: #111827; }
        blockquote { border-left: 3px solid #cbd5e1; padding-left: 10px; color: #4b5563; margin-left: 0; }
      </style>
      </head>
      <body>
        <h1>${model.title}</h1>
        ${sectionsHtml}
      </body>
      </html>
    `;
        });
    }
}
exports.DocxAdapter = DocxAdapter;
// PDF Adapter
class PDFAdapter {
    transform(model) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            // 1. Cover Page
            doc.font('Helvetica-Bold').fontSize(28).fillColor('#1e3a8a').text(model.title, { align: 'center' });
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(12).fillColor('#4b5563').text('Generated by PDF-Crab Digital Notebook Compiler', { align: 'center' });
            doc.moveDown(2);
            // Table of Contents
            doc.font('Helvetica-Bold').fontSize(16).fillColor('#111827').text('Table of Contents');
            doc.moveDown(1);
            for (const section of model.sections) {
                doc.font('Helvetica').fontSize(11).fillColor('#2563eb').text(`• ${section.heading}`);
            }
            // Add page break before first topic
            doc.addPage();
            // 2. Render Topics
            for (let idx = 0; idx < model.sections.length; idx++) {
                const section = model.sections[idx];
                // Page break between major topics
                if (idx > 0) {
                    doc.addPage();
                }
                doc.font('Helvetica-Bold').fontSize(20).fillColor('#1e3a8a').text(section.heading);
                doc.moveDown(1);
                // Parse markdown body line by line for typesetting layout
                const lines = section.body.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed)
                        continue;
                    // Check if visual image tag
                    if (trimmed.startsWith('![') && trimmed.includes('](')) {
                        const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
                        if (match) {
                            const imageUrl = match[2];
                            try {
                                // Fetch and embed inline visual crops securely with retries and auth headers
                                const imgBuffer = yield fetchImageBuffer(imageUrl);
                                doc.image(imgBuffer, { fit: [450, 200], align: 'center' });
                                doc.moveDown(1);
                            }
                            catch (err) {
                                console.error(`Failed to embed PDF image: ${imageUrl}`, err);
                                throw new Error(`Export PDF Image Embedding failed for URL: ${imageUrl}. Error: ${err instanceof Error ? err.message : String(err)}`);
                            }
                        }
                        continue;
                    }
                    // Check for blockquote definitions
                    if (trimmed.startsWith('>')) {
                        doc.font('Helvetica-Oblique').fontSize(11).fillColor('#4b5563').text(trimmed.substring(1).trim(), { align: 'justify', indent: 15 });
                        doc.moveDown(0.5);
                        continue;
                    }
                    // Bold prefixes typesetting
                    if (trimmed.startsWith('**') && trimmed.includes('**:')) {
                        const boldMatch = trimmed.match(/^\*\*(.*?)\*\*:(.*)$/);
                        if (boldMatch) {
                            doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(`${boldMatch[1]}:`, { continued: true });
                            doc.font('Helvetica').fontSize(11).fillColor('#374151').text(boldMatch[2]);
                            doc.moveDown(0.5);
                            continue;
                        }
                    }
                    // Default text
                    doc.font('Helvetica').fontSize(11).fillColor('#374151').text(trimmed, { align: 'justify', lineGap: 2 });
                    doc.moveDown(0.5);
                }
                // Metadata at the bottom of the section
                if (section.metadata) {
                    doc.moveDown(1);
                    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Study Intelligence & Dependencies:');
                    const si = section.metadata.studyIntelligence;
                    if (si) {
                        doc.font('Helvetica').fontSize(9).fillColor('#4b5563').text(`• Completeness: ${si.completeness.percentage}% | Confidence: ${si.confidence}/10`);
                        if (si.missingPrerequisites.length > 0) {
                            doc.font('Helvetica').fontSize(9).fillColor('#ef4444').text(`• Missing Prerequisites: ${si.missingPrerequisites.join(', ')}`);
                        }
                        if (si.conflicts.length > 0) {
                            doc.font('Helvetica').fontSize(9).fillColor('#b45309').text(`• Conflicts: ${si.conflicts.join('; ')}`);
                        }
                    }
                }
            }
            doc.end();
            return new Promise((resolve) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
            });
        });
    }
}
exports.PDFAdapter = PDFAdapter;
