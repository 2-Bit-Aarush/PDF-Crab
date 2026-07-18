import PDFDocument from 'pdfkit'
import { AssetResolver } from './resolver'
import { parseNotebookSection, CompiledSectionBlock } from './parser'

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



    const pagesWithContent = new Set<number>()
    const markCurrentPageActive = () => {
      const pagesArr = (doc as any)._pageBuffer
      if (pagesArr) {
        const pageIdx = pagesArr.indexOf(doc.page)
        if (pageIdx !== -1) {
          pagesWithContent.add(pageIdx)
        }
      }
    }

    // Height estimators
    const width = doc.page.width
    const height = doc.page.height
    const contentWidth = width - doc.page.margins.left - doc.page.margins.right

    const estHeadingHeight = (heading: string) => {
      doc.font(fonts.bold).fontSize(20)
      return doc.heightOfString(heading, { width: contentWidth }) + 10
    }

    const estCalloutHeight = (title: string, text: string) => {
      doc.font(fonts.bold).fontSize(10)
      const titleHeight = doc.heightOfString(title, { width: contentWidth - 24 })
      doc.font(fonts.italic).fontSize(9.5)
      const textHeight = doc.heightOfString(text, { width: contentWidth - 24 })
      return titleHeight + textHeight + 12 * 2.2 + 10
    }

    const estPointsCardHeight = (title: string, points: any[]) => {
      doc.font(fonts.bold).fontSize(10)
      let contentHeight = doc.heightOfString(title, { width: contentWidth - 24 }) + 6
      doc.font(fonts.regular).fontSize(9.5)
      for (const pt of points) {
        const text = typeof pt === 'object' ? pt.text : pt
        const src = typeof pt === 'object' && pt.source ? ` (Source: ${pt.source})` : ''
        contentHeight += doc.heightOfString(`•  ${text}${src}`, { width: contentWidth - 24 }) + 3
      }
      return contentHeight + 12 * 2 + 10
    }

    const estExplanationHeight = (text: string) => {
      doc.font(fonts.bold).fontSize(11)
      const labelHeight = doc.heightOfString('Key Explanation') + 4
      doc.font(fonts.regular).fontSize(10)
      const textHeight = doc.heightOfString(text, { width: contentWidth, align: 'justify', lineGap: 3 })
      return labelHeight + textHeight + 12
    }

    const estTrendsHeight = (text: string) => {
      doc.font(fonts.bold).fontSize(11)
      const labelHeight = doc.heightOfString('Trends & Reference Tables') + 4
      doc.font(fonts.regular).fontSize(10)
      const textHeight = doc.heightOfString(text, { width: contentWidth, align: 'justify', lineGap: 3 })
      return labelHeight + textHeight + 12
    }

    const estExampleBoxHeight = (index: number, text: string, source: string) => {
      doc.font(fonts.bold).fontSize(10)
      const titleHeight = doc.heightOfString(`Worked Example ${index}`, { width: contentWidth - 24 })
      doc.font(fonts.regular).fontSize(9.5)
      const textHeight = doc.heightOfString(text, { width: contentWidth - 24 })
      const srcHeight = source ? doc.heightOfString(`Source: ${source}`, { width: contentWidth - 24 }) + 2 : 0
      return titleHeight + textHeight + srcHeight + 12 * 2.2 + 10
    }

    const estNotesHeight = (text: string) => {
      doc.font(fonts.bold).fontSize(11)
      const labelHeight = doc.heightOfString('Notes & Exceptions') + 4
      doc.font(fonts.regular).fontSize(10)
      const textHeight = doc.heightOfString(text, { width: contentWidth, align: 'justify', lineGap: 3 })
      return labelHeight + textHeight + 12
    }

    const estSourceEvidenceHeight = (visList: any[]) => {
      doc.font(fonts.bold).fontSize(11)
      let total = doc.heightOfString('Original Source Evidence') + 6
      for (const vis of visList) {
        total += 150 + 15
        doc.font(fonts.bold).fontSize(9)
        total += doc.heightOfString(vis.caption, { align: 'center' }) + 4
        if (vis.source) {
          doc.font(fonts.italic).fontSize(8)
          total += doc.heightOfString(`Source: ${vis.source}`, { align: 'center' }) + 4
        }
        total += 12
      }
      return total
    }

    const estMetadataCardHeight = () => {
      return 55 + 10
    }

    const checkPageBreak = (_componentName: string, estimatedHeight: number) => {
      const pageHeight = doc.page.height
      const bottomMargin = doc.page.margins.bottom
      const remainingHeight = pageHeight - bottomMargin - doc.y
      
      if (remainingHeight < estimatedHeight) {
        doc.addPage()
      }
    }

    // 1. Cover Page (Page 0)
    markCurrentPageActive()
    
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
    
    // Add Table of Contents page (Page 1) but leave it empty initially
    doc.addPage()
    markCurrentPageActive()

    // Add sections page (Page 2)
    doc.addPage()

    let totalSourceEvidenceImagesExpected = 0
    let totalSourceEvidenceImagesRendered = 0
    let hasBrokenImages = false
    const sectionStartPages: number[] = []

    // 3. Render Topics
    for (let idx = 0; idx < model.sections.length; idx++) {
      const section = model.sections[idx]
      const blocks = parseNotebookSection(section)
      
      if (idx > 0) {
        // Evaluate page break before sections
        const estHeadingH = estHeadingHeight(blocks.heading)
        checkPageBreak(`Heading: ${blocks.heading}`, estHeadingH)
      }

      const currentPagesArr = (doc as any)._pages
      if (currentPagesArr) {
        sectionStartPages[idx] = currentPagesArr.indexOf(doc.page)
      }

      // Draw Section Header (Topic Title)
      markCurrentPageActive()
      doc.font(fonts.bold).fontSize(20).fillColor('#1e3a8a').text(blocks.heading)
      doc.moveDown(0.5)

      // 1. Definition
      if (blocks.definition && !blocks.definition.includes('(No verbatim definition')) {
        const estH = estCalloutHeight('Verbatim Definition', blocks.definition)
        checkPageBreak('Verbatim Definition', estH)
        markCurrentPageActive()
        drawCalloutBox(doc, 'Verbatim Definition', blocks.definition, fonts)
      }

      // 2. Key Points
      if (blocks.keyPoints && blocks.keyPoints.length > 0) {
        const estH = estPointsCardHeight('Key Points & Insights', blocks.keyPoints)
        checkPageBreak('Key Points & Insights', estH)
        markCurrentPageActive()
        drawPointsCard(doc, 'Key Points & Insights', blocks.keyPoints, fonts)
      }

      // 3. Detailed Explanation (Key Explanation)
      if (blocks.explanation) {
        const estH = estExplanationHeight(blocks.explanation)
        checkPageBreak('Key Explanation', estH)
        markCurrentPageActive()
        doc.font(fonts.bold).fontSize(11).fillColor('#1e3a8a').text('Key Explanation')
        doc.moveDown(0.3)
        doc.font(fonts.regular).fontSize(10).fillColor('#1f2937').text(blocks.explanation, { align: 'justify', lineGap: 3 })
        doc.moveDown(1)
      }

      // 4. Important Trends / Tables
      if (blocks.trendsAndTables) {
        const estH = estTrendsHeight(blocks.trendsAndTables)
        checkPageBreak('Trends & Reference Tables', estH)
        markCurrentPageActive()
        doc.font(fonts.bold).fontSize(11).fillColor('#1e3a8a').text('Trends & Reference Tables')
        doc.moveDown(0.3)
        doc.font(fonts.regular).fontSize(10).fillColor('#1f2937').text(blocks.trendsAndTables, { align: 'justify', lineGap: 3 })
        doc.moveDown(1)
      }

      // 5. Examples
      if (blocks.examples && blocks.examples.length > 0) {
        let exCounter = 1
        for (const ex of blocks.examples) {
          const estH = estExampleBoxHeight(exCounter, ex.text, ex.source)
          checkPageBreak(`Worked Example ${exCounter}`, estH)
          markCurrentPageActive()
          drawExampleBox(doc, exCounter++, ex.text, ex.source, fonts)
        }
      }

      // 6. Notes / Exceptions
      if (blocks.notesAndExceptions) {
        const estH = estNotesHeight(blocks.notesAndExceptions)
        checkPageBreak('Notes & Exceptions', estH)
        markCurrentPageActive()
        doc.font(fonts.bold).fontSize(11).fillColor('#b91c1c').text('Notes & Exceptions')
        doc.moveDown(0.3)
        doc.font(fonts.regular).fontSize(10).fillColor('#7f1d1d').text(blocks.notesAndExceptions, { align: 'justify', lineGap: 3 })
        doc.moveDown(1)
      }

      // 7. Original Source Evidence (grouped together at the end)
      if (blocks.sourceEvidence && blocks.sourceEvidence.length > 0) {
        const estH = estSourceEvidenceHeight(blocks.sourceEvidence)
        checkPageBreak('Original Source Evidence', estH)
        markCurrentPageActive()
        doc.font(fonts.bold).fontSize(11).fillColor('#4b5563').text('Original Source Evidence')
        doc.moveDown(0.5)

        totalSourceEvidenceImagesExpected += blocks.sourceEvidence.length

        for (const vis of blocks.sourceEvidence) {
          try {
            const resolved = await AssetResolver.resolve(vis.url)
            if (resolved) {
              markCurrentPageActive()
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
              totalSourceEvidenceImagesRendered++
            } else {
              hasBrokenImages = true
            }
          } catch (err) {
            hasBrokenImages = true
            console.warn(`PDFAdapter: Failed to render image crop ${vis.url}:`, err)
          }
        }
      }

      // Metadata card at bottom
      if (section.metadata) {
        const estH = estMetadataCardHeight()
        checkPageBreak('Study Intelligence Metadata', estH)
        markCurrentPageActive()
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

    // 2. Render Table of Contents on Page 1 using final correct page numbers
    doc.switchToPage(1)
    doc.y = doc.page.margins.top
    doc.font(fonts.bold).fontSize(18).fillColor('#1e3a8a').text('Table of Contents')
    doc.moveDown(1.5)
    
    for (let i = 0; i < model.sections.length; i++) {
      const section = model.sections[i]
      const startPage = sectionStartPages[i]
      const displayPageNum = startPage + 1

      doc.font(fonts.bold).fontSize(11).fillColor('#1f2937').text(`${i + 1}.  ${section.heading}`, { continued: true })
      doc.font(fonts.regular).fillColor('#9ca3af').text(' ............................................................................................ ', { continued: true })
      doc.font(fonts.bold).fillColor('#2563eb').text(`Page ${displayPageNum}`)
      doc.moveDown(0.8)
    }

    // Content Completeness & Image Reference Integrity Validation Pass
    if (hasBrokenImages || totalSourceEvidenceImagesRendered < totalSourceEvidenceImagesExpected) {
      throw new Error(`PDF Export Validation Failed: Missing or broken source evidence images. Expected ${totalSourceEvidenceImagesExpected} images but rendered ${totalSourceEvidenceImagesRendered}.`)
    }

    // Global Header & Footer Drawing safely
    if (typeof doc.bufferedPageRange === 'function') {
      const range = doc.bufferedPageRange()
      
      // Monkey patch addPage to do absolutely nothing during header/footer drawing!
      // This prevents any line wrap/height calculation on headers and footers from triggering recursive empty pages.
      const addPageAfterLoop = doc.addPage
      doc.addPage = function() {
        return doc
      }

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
      
      // Restore addPage
      doc.addPage = addPageAfterLoop
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

