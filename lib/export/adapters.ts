import PDFDocument from 'pdfkit'
import { AssetResolver } from './resolver'

export interface NotebookViewModel {
  title: string
  sections: {
    heading: string
    body: string // clean markdown
    metadata?: {
      id?: string
      title?: string
      prerequisites?: string[]
      relatedTopics?: string[]
      difficulty?: string
      importanceScore?: number
      studyIntelligence?: {
        coverage: { score: number; documents: string[] }
        completeness: { percentage: number }
        importance: number
        confidence: number
        missingPrerequisites: string[]
        conflicts: string[]
      }
    }
  }[]
}

export interface OutputAdapter<T> {
  transform(model: NotebookViewModel): Promise<T>
}

// Markdown Adapter
export class MarkdownAdapter implements OutputAdapter<string> {
  async transform(model: NotebookViewModel): Promise<string> {
    let output = `# ${model.title}\n\n`
    for (const section of model.sections) {
      output += `## ${section.heading}\n\n${section.body}\n\n`
      if (section.metadata) {
        output += `### Study Metadata\n`
        const si = section.metadata.studyIntelligence
        if (si) {
          output += `- **Completeness**: ${si.completeness.percentage}%\n`
          output += `- **Confidence**: ${si.confidence}/10\n`
          if (si.missingPrerequisites.length > 0) {
            output += `- **Missing Prerequisites**: ${si.missingPrerequisites.join(', ')}\n`
          }
          if (si.conflicts.length > 0) {
            output += `- **Conflicts Detected**: ${si.conflicts.join('; ')}\n`
          }
        }
        output += `\n`
      }
      output += `---\n\n`
    }
    return output
  }
}

// DOCX Adapter (Generates a clean, styles-enriched MS Word HTML payload)
export class DocxAdapter implements OutputAdapter<string> {
  async transform(model: NotebookViewModel): Promise<string> {
    let sectionsHtml = ''
    for (const section of model.sections) {
      // Pre-resolve and validate images in section body using the unified resolver
      const imgMatch = [...section.body.matchAll(/!\[(.*?)\]\((.*?)\)/g)]
      for (const match of imgMatch) {
        const url = match[2]
        try {
          const resolved = await AssetResolver.resolve(url)
          if (!resolved) {
            console.warn(`DocxAdapter: Unresolved image asset: ${url} inside topic: ${section.heading}`)
          }
        } catch (err) {
          console.warn(`DocxAdapter: Failed to resolve image asset: ${url} inside topic: ${section.heading}.`)
        }
      }

      // Basic markdown to html replacement for Word compatibility
      let htmlBody = section.body
        .replace(/\n/g, '<br>')
        .replace(/\*\*Definition\*\*:/g, '<strong>Definition:</strong>')
        .replace(/\*\*Key Explanation\*\*:/g, '<strong>Key Explanation:</strong>')
        .replace(/\*\*Visual Snippet\*\*:/g, '<strong>Visual Snippet:</strong>')
        .replace(/\*\*Example\*\*:/g, '<strong>Example:</strong>')
        .replace(/\*\*Important Points\*\*:/g, '<strong>Important Points:</strong>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 500px; display: block; margin: 10px 0;"><br>')

      sectionsHtml += `
        <h2 style="font-size: 18pt; color: #1e3a8a; margin-top: 24pt; page-break-before: always;">${section.heading}</h2>
        <div style="font-size: 11pt; color: #333333; line-height: 1.5;">
          ${htmlBody}
        </div>
      `
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
    `
  }
}

// Font resolver for Unicode support
function getFonts() {
  const fonts = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique'
  }
  
  // Windows System Fonts
  const winFonts = {
    regular: 'C:\\Windows\\Fonts\\arial.ttf',
    bold: 'C:\\Windows\\Fonts\\arialbd.ttf',
    italic: 'C:\\Windows\\Fonts\\ariali.ttf'
  }
  
  const fs = require('fs');
  if (fs.existsSync(winFonts.regular)) {
    fonts.regular = winFonts.regular;
  }
  if (fs.existsSync(winFonts.bold)) {
    fonts.bold = winFonts.bold;
  }
  if (fs.existsSync(winFonts.italic)) {
    fonts.italic = winFonts.italic;
  }
  
  return fonts;
}

// Custom themed layout blocks
function drawCalloutBox(doc: any, title: string, text: string, fonts: any) {
  const x = doc.x;
  const y = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  
  doc.font(fonts.bold).fontSize(10).fillColor('#1e3a8a');
  const titleHeight = doc.heightOfString(title, { width: width - 24 });
  
  doc.font(fonts.italic).fontSize(9.5).fillColor('#4b5563');
  const textHeight = doc.heightOfString(text, { width: width - 24 });
  
  const padding = 12;
  const boxHeight = titleHeight + textHeight + padding * 2.2;
  
  doc.save();
  doc.rect(x, y, width, boxHeight).fill('#eff6ff');
  doc.rect(x, y, 4, boxHeight).fill('#2563eb');
  doc.restore();
  
  doc.font(fonts.bold).fontSize(10).fillColor('#1e3a8a').text(title, x + 16, y + padding, { width: width - 24 });
  doc.moveDown(0.2);
  doc.font(fonts.italic).fontSize(9.5).fillColor('#4b5563').text(text, x + 16, doc.y, { width: width - 24, align: 'justify' });
  
  doc.y = y + boxHeight;
  doc.moveDown(0.8);
}

function drawPointsCard(doc: any, title: string, points: any[], fonts: any) {
  const x = doc.x;
  const y = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const padding = 12;
  
  doc.font(fonts.bold).fontSize(10);
  let contentHeight = doc.heightOfString(title, { width: width - 24 }) + 6;
  
  doc.font(fonts.regular).fontSize(9.5);
  for (const pt of points) {
    const text = typeof pt === 'object' ? pt.text : pt;
    const src = typeof pt === 'object' && pt.source ? ` (Source: ${pt.source})` : '';
    contentHeight += doc.heightOfString(`•  ${text}${src}`, { width: width - 24 }) + 3;
  }
  
  const boxHeight = contentHeight + padding * 2;
  
  doc.save();
  doc.rect(x, y, width, boxHeight).fillAndStroke('#f9fafb', '#e5e7eb');
  doc.restore();
  
  doc.font(fonts.bold).fontSize(10).fillColor('#111827').text(title, x + 12, y + padding);
  doc.moveDown(0.4);
  
  doc.font(fonts.regular).fontSize(9.5).fillColor('#374151');
  for (const pt of points) {
    const text = typeof pt === 'object' ? pt.text : pt;
    const src = typeof pt === 'object' && pt.source ? ` (Source: ${pt.source})` : '';
    
    doc.font(fonts.regular).fillColor('#2563eb').text('•  ', x + 12, doc.y, { continued: true });
    doc.fillColor('#374151').text(`${text}`, { continued: src !== '' });
    if (src) {
      doc.font(fonts.italic).fillColor('#9ca3af').text(` (${src})`);
    } else {
      doc.text('');
    }
    doc.moveDown(0.25);
  }
  
  doc.y = y + boxHeight;
  doc.moveDown(0.8);
}

function drawExampleBox(doc: any, index: number, text: string, source: string, fonts: any) {
  const x = doc.x;
  const y = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const padding = 12;
  
  doc.font(fonts.bold).fontSize(10);
  const titleHeight = doc.heightOfString(`Worked Example ${index}`, { width: width - 24 });
  
  doc.font(fonts.regular).fontSize(9.5);
  const textHeight = doc.heightOfString(text, { width: width - 24 });
  const srcHeight = source ? doc.heightOfString(`Source: ${source}`, { width: width - 24 }) + 2 : 0;
  
  const boxHeight = titleHeight + textHeight + srcHeight + padding * 2.2;
  
  doc.save();
  doc.rect(x, y, width, boxHeight).fill('#fffbeb');
  doc.rect(x, y, 4, boxHeight).fill('#f59e0b');
  doc.restore();
  
  doc.font(fonts.bold).fontSize(10).fillColor('#b45309').text(`Worked Example ${index}`, x + 16, y + padding);
  doc.moveDown(0.2);
  doc.font(fonts.regular).fontSize(9.5).fillColor('#451a03').text(text, x + 16, doc.y, { width: width - 24, align: 'justify' });
  
  if (source) {
    doc.moveDown(0.2);
    doc.font(fonts.italic).fontSize(8.5).fillColor('#9ca3af').text(`Source: ${source}`, x + 16, doc.y);
  }
  
  doc.y = y + boxHeight;
  doc.moveDown(0.8);
}

// PDF Adapter
export class PDFAdapter implements OutputAdapter<Buffer> {
  async transform(model: NotebookViewModel): Promise<Buffer> {
    const fonts = getFonts()
    const doc = new PDFDocument({ margin: 50, bufferPages: true })
    const chunks: any[] = []

    doc.on('data', (chunk) => chunks.push(chunk))

    // 1. Cover Page
    const width = doc.page.width
    const height = doc.page.height
    
    doc.save()
    doc.rect(0, 0, width, 180).fill('#1e3a8a')
    doc.restore()
    
    doc.y = 220
    doc.font(fonts.bold).fontSize(28).fillColor('#1e3a8a').text(model.title, { align: 'center', width: width - 100 })
    doc.moveDown(0.5)
    
    doc.strokeColor('#cbd5e1').lineWidth(1.5).moveTo(150, doc.y).lineTo(width - 150, doc.y).stroke()
    doc.moveDown(1.5)
    
    doc.font(fonts.bold).fontSize(12).fillColor('#4b5563').text('STUDY NOTEBOOK COLLECTION', { align: 'center', characterSpacing: 1.5 })
    doc.moveDown(0.5)
    doc.font(fonts.italic).fontSize(10).fillColor('#6b7280').text('Compiled by PDF-Crab Digital Compiler', { align: 'center' })
    
    const cardY = height - 160
    doc.save()
    doc.rect(80, cardY, width - 160, 80).fillAndStroke('#f3f4f6', '#e5e7eb')
    doc.restore()
    
    doc.font(fonts.bold).fontSize(9).fillColor('#4b5563').text('Date Compiled:', 100, cardY + 20)
    doc.font(fonts.regular).fillColor('#1f2937').text(new Date().toLocaleDateString(), 180, cardY + 20)
    
    doc.font(fonts.bold).fillColor('#4b5563').text('Source Material:', 100, cardY + 45)
    doc.font(fonts.regular).fillColor('#1f2937').text('Processed scanned classroom lecture notes & structures', 180, cardY + 45)
    
    doc.addPage()

    // 2. Table of Contents
    doc.font(fonts.bold).fontSize(18).fillColor('#1e3a8a').text('Table of Contents')
    doc.moveDown(1.5)
    
    for (let i = 0; i < model.sections.length; i++) {
      const section = model.sections[i]
      doc.font(fonts.bold).fontSize(11).fillColor('#1f2937').text(`${i + 1}.  ${section.heading}`, { continued: true })
      doc.font(fonts.regular).fillColor('#9ca3af').text(' ............................................................................................ ', { continued: true })
      doc.font(fonts.bold).fillColor('#2563eb').text(`Page ${i + 3}`)
      doc.moveDown(0.8)
    }

    doc.addPage()

    // 3. Render Topics
    for (let idx = 0; idx < model.sections.length; idx++) {
      const section = model.sections[idx]
      
      if (idx > 0) {
        doc.addPage()
      }

      // Draw Section Header
      doc.font(fonts.bold).fontSize(20).fillColor('#1e3a8a').text(section.heading)
      doc.moveDown(0.5)
      
      // Parse markdown body
      const lines = section.body.split('\n')
      let currentBlockType: 'none' | 'definition' | 'explanation' | 'visuals' | 'examples' | 'points' = 'none'
      
      let definition = ''
      let explanation = ''
      const visuals: { caption: string; url: string; source: string }[] = []
      const examples: { text: string; source: string }[] = []
      const points: { text: string; source: string }[] = []
      
      for (let lIdx = 0; lIdx < lines.length; lIdx++) {
        const line = lines[lIdx].trim()
        if (!line) continue
        
        if (line.startsWith('**Definition**:')) {
          currentBlockType = 'definition'
          continue
        } else if (line.startsWith('**Key Explanation**:')) {
          currentBlockType = 'explanation'
          continue
        } else if (line.startsWith('**Visual Snippet**:')) {
          currentBlockType = 'visuals'
          continue
        } else if (line.startsWith('**Example**:')) {
          currentBlockType = 'examples'
          continue
        } else if (line.startsWith('**Important Points**:')) {
          currentBlockType = 'points'
          continue
        }
        
        if (currentBlockType === 'definition') {
          if (line.startsWith('>')) {
            definition += (definition ? '\n' : '') + line.substring(1).trim()
          } else {
            definition += (definition ? '\n' : '') + line
          }
        } else if (currentBlockType === 'explanation') {
          explanation += (explanation ? '\n' : '') + line
        } else if (currentBlockType === 'visuals') {
          if (line.startsWith('![')) {
            const match = line.match(/!\[(.*?)\]\((.*?)\)/)
            if (match) {
              const caption = match[1]
              const url = match[2]
              let source = ''
              if (lIdx + 1 < lines.length && lines[lIdx + 1].trim().startsWith('*Source:')) {
                source = lines[lIdx + 1].replace(/\*Source:|\*/g, '').trim()
                lIdx++
              }
              visuals.push({ caption, url, source })
            }
          }
        } else if (currentBlockType === 'examples') {
          if (line.startsWith('>')) {
            const text = line.substring(1).trim()
            let source = ''
            if (lIdx + 1 < lines.length && lines[lIdx + 1].trim().startsWith('*Source:')) {
              source = lines[lIdx + 1].replace(/\*Source:|\*/g, '').trim()
              lIdx++
            }
            examples.push({ text, source })
          }
        } else if (currentBlockType === 'points') {
          if (line.startsWith('-')) {
            const textRaw = line.substring(1).trim()
            const srcMatch = textRaw.match(/(.*)\((Source:.*?)\)/)
            if (srcMatch) {
              points.push({ text: srcMatch[1].trim(), source: srcMatch[2].replace('Source:', '').trim() })
            } else {
              points.push({ text: textRaw, source: '' })
            }
          }
        }
      }

      // Render Definition
      if (definition && !definition.includes('(No verbatim definition')) {
        drawCalloutBox(doc, 'Verbatim Definition', definition, fonts)
      }

      // Render Explanation
      if (explanation) {
        doc.font(fonts.bold).fontSize(11).fillColor('#1e3a8a').text('Key Explanation')
        doc.moveDown(0.3)
        doc.font(fonts.regular).fontSize(10).fillColor('#1f2937').text(explanation, { align: 'justify', lineGap: 3 })
        doc.moveDown(1)
      }

      // Render Visual Snippets
      for (const vis of visuals) {
        try {
          const resolved = await AssetResolver.resolve(vis.url)
          if (resolved) {
            const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
            const imgWidth = 350
            const imgHeight = 150
            const startX = doc.page.margins.left + (contentWidth - imgWidth) / 2
            
            doc.save()
            doc.rect(startX - 10, doc.y - 10, imgWidth + 20, imgHeight + 20).stroke('#e5e7eb')
            doc.restore()
            
            doc.image(resolved.buffer, startX, doc.y, { fit: [imgWidth, imgHeight], align: 'center' })
            doc.y += imgHeight + 15
            
            doc.font(fonts.bold).fontSize(9).fillColor('#4b5563').text(vis.caption, { align: 'center' })
            if (vis.source) {
              doc.font(fonts.italic).fontSize(8).fillColor('#9ca3af').text(`Source: ${vis.source}`, { align: 'center' })
            }
            doc.moveDown(1)
          }
        } catch (err) {
          console.warn(`PDFAdapter: Failed to render image crop ${vis.url}:`, err)
        }
      }

      // Render Examples
      let exCounter = 1
      for (const ex of examples) {
        drawExampleBox(doc, exCounter++, ex.text, ex.source, fonts)
      }

      // Render Important Points Card
      if (points.length > 0) {
        drawPointsCard(doc, 'Key Points & Insights', points, fonts)
      }

      // Metadata card at bottom
      if (section.metadata) {
        const si = section.metadata.studyIntelligence
        if (si) {
          const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
          doc.save()
          doc.rect(doc.x, doc.y, contentWidth, 55).fillAndStroke('#f8fafc', '#e2e8f0')
          doc.restore()
          
          doc.font(fonts.bold).fontSize(8.5).fillColor('#334155').text('Study Intelligence & Traceability', doc.x + 12, doc.y + 8)
          doc.font(fonts.regular).fontSize(8).fillColor('#64748b').text(`• Coverage Score: ${si.coverage.score}% across documents: ${si.coverage.documents.join(', ')}`, doc.x + 12, doc.y + 3)
          doc.font(fonts.regular).text(`• Completeness: ${si.completeness.percentage}% | Confidence level: ${si.confidence}/10`, doc.x + 12)
          doc.y += 10
        }
      }
    }

    // Global Header & Footer Drawing
    const range = doc.bufferedPageRange()
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i)
      
      // Skip cover page
      if (i === 0) continue
      
      const pWidth = doc.page.width
      const pHeight = doc.page.height
      const margin = 50
      
      // Header
      doc.save()
      doc.font(fonts.italic).fontSize(8).fillColor('#9ca3af')
      doc.text('Digital Study Notebook', margin, 30)
      doc.text(model.title, margin, 30, { align: 'right', width: pWidth - margin * 2 })
      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, 42).lineTo(pWidth - margin, 42).stroke()
      
      // Footer
      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, pHeight - 42).lineTo(pWidth - margin, pHeight - 42).stroke()
      doc.font(fonts.regular).fontSize(8).fillColor('#9ca3af')
      doc.text(`Page ${i + 1} of ${range.count}`, margin, pHeight - 35, { align: 'right', width: pWidth - margin * 2 })
      doc.text('PDF-Crab compiler', margin, pHeight - 35)
      doc.restore()
    }

    doc.end()

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
    })
  }
}

// Future Placeholder Interfaces
export interface FlashcardAdapter extends OutputAdapter<any[]> {}
export interface QuizAdapter extends OutputAdapter<any[]> {}
export interface MindMapAdapter extends OutputAdapter<any> {}
export interface AnkiAdapter extends OutputAdapter<Buffer> {}

