import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOCRProvider } from '@/lib/ocr/provider'
import { recordTelemetry } from '@/lib/dev-logger'
import { PDFDocument } from 'pdf-lib'
import { pdfToPng } from 'pdf-to-png-converter'
import { Jimp } from 'jimp'

interface DocBlock {
  id: string
  type: 'text' | 'visual'
  subType: string
  content: string
  coordinates: { x1: number; y1: number; x2: number; y2: number }
  imageUrl?: string
  pageIndex: number
  semanticType: 'Natural Language' | 'Scientific Notation' | 'Mathematical Expression' | 'Chemical Equation / Structure' | 'Scientific Table' | 'Scientific Diagram'
  protectedContent: boolean
}

async function cropPdfRegion(
  pdfBuffer: Buffer,
  pageIndex: number,
  pageDims: { width: number; height: number },
  coords: { x1: number; y1: number; x2: number; y2: number }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const croppedDoc = await PDFDocument.create()
  const [copiedPage] = await croppedDoc.copyPages(pdfDoc, [pageIndex])
  croppedDoc.addPage(copiedPage)

  const { width: pdfWidth, height: pdfHeight } = copiedPage.getSize()

  const scaleX = pdfWidth / pageDims.width
  const scaleY = pdfHeight / pageDims.height

  // Bounding boxes coordinates map from top-left origin (OCR) to bottom-left origin (PDF)
  const x = coords.x1 * scaleX
  const y = (pageDims.height - coords.y2) * scaleY
  const w = (coords.x2 - coords.x1) * scaleX
  const h = (coords.y2 - coords.y1) * scaleY

  // Add small padding around the cropped region to avoid cutting off boundaries
  const padding = 2
  const paddedX = Math.max(0, x - padding)
  const paddedY = Math.max(0, y - padding)
  const paddedW = Math.min(pdfWidth - paddedX, w + 2 * padding)
  const paddedH = Math.min(pdfHeight - paddedY, h + 2 * padding)

  copiedPage.setCropBox(paddedX, paddedY, paddedW, paddedH)
  copiedPage.setMediaBox(paddedX, paddedY, paddedW, paddedH)

  const savedPdfBytes = await croppedDoc.save()

  // Convert the single cropped page to a high-resolution PNG image
  const result = await pdfToPng(Buffer.from(savedPdfBytes), {
    viewportScale: 3.0, // High-resolution scale
  })

  if (!result || result.length === 0 || !result[0].content) {
    throw new Error('PDF conversion returned no image pages')
  }

  return result[0].content as Buffer
}

async function cropImageRegion(
  imageBuffer: Buffer,
  pageDims: { width: number; height: number },
  coords: { x1: number; y1: number; x2: number; y2: number }
): Promise<Buffer> {
  const image = await Jimp.read(imageBuffer)
  
  const scaleX = image.width / pageDims.width
  const scaleY = image.height / pageDims.height
  
  const x = Math.max(0, Math.floor(coords.x1 * scaleX))
  const y = Math.max(0, Math.floor(coords.y1 * scaleY))
  const w = Math.min(image.width - x, Math.ceil((coords.x2 - coords.x1) * scaleX))
  const h = Math.min(image.height - y, Math.ceil((coords.y2 - coords.y1) * scaleY))
  
  image.crop({ x, y, w, h })
  return await image.getBuffer('image/png')
}

function getContextAwareCoordinates(
  block: any,
  allBlocks: any[],
  pageDims: { width: number; height: number }
): { x1: number; y1: number; x2: number; y2: number } {
  let x1 = block.top_left_x ?? 0
  let y1 = block.top_left_y ?? 0
  let x2 = block.bottom_right_x ?? pageDims.width
  let y2 = block.bottom_right_y ?? pageDims.height

  let mergedAny = true
  const mergedIndices = new Set<number>()

  while (mergedAny) {
    mergedAny = false
    for (let i = 0; i < allBlocks.length; i++) {
      if (allBlocks[i] === block || mergedIndices.has(i)) continue

      const c = allBlocks[i]
      const cx1 = c.top_left_x ?? 0
      const cy1 = c.top_left_y ?? 0
      const cx2 = c.bottom_right_x ?? pageDims.width
      const cy2 = c.bottom_right_y ?? pageDims.height

      // Check vertical proximity (within 85px) and horizontal overlap/proximity
      const horizontalOverlap = Math.max(cx1, x1) <= Math.min(cx2, x2) + 80
      const verticalProximity = 
        (cy2 >= y1 - 85 && cy1 <= y2 + 85) || 
        (y2 >= cy1 - 85 && y1 <= cy2 + 85)

      if (horizontalOverlap && verticalProximity) {
        x1 = Math.min(x1, cx1)
        y1 = Math.min(y1, cy1)
        x2 = Math.max(x2, cx2)
        y2 = Math.max(y2, cy2)
        mergedIndices.add(i)
        mergedAny = true
      }
    }
  }

  return { x1, y1, x2, y2 }
}

function getAdaptivePadding(
  coords: { x1: number; y1: number; x2: number; y2: number },
  classification: { type: 'text' | 'visual'; subType: string },
  scienceInfo: { semanticType: string }
): number {
  const w = coords.x2 - coords.x1
  const h = coords.y2 - coords.y1

  const isEquation = 
    classification.subType === 'Formula' || 
    classification.subType === 'Mathematical Equation' || 
    classification.subType === 'Chemistry Equation' || 
    scienceInfo.semanticType === 'Scientific Notation' || 
    scienceInfo.semanticType === 'Mathematical Expression';

  const isTable = 
    classification.subType === 'Table' || 
    scienceInfo.semanticType === 'Scientific Table';

  const isGraph = 
    classification.subType === 'Graph';

  const isDiagram = 
    classification.subType === 'Diagram' || 
    classification.subType === 'Circuit Diagram' || 
    classification.subType === 'Flowchart' || 
    classification.subType === 'Lewis Structure' || 
    classification.subType === 'Reaction Mechanism' || 
    scienceInfo.semanticType === 'Scientific Diagram';

  if (isEquation) {
    if (w < 300 && h < 100) {
      return 45 // 30–60 px surrounding margin
    }
    return 30
  }

  if (isGraph) {
    return 40 // Preserve complete graph with labels
  }

  if (isTable) {
    return 25 // Preserve entire table
  }

  if (isDiagram) {
    if (w > 450 || h > 550) {
      return 10
    }
    return 20
  }

  return 20
}

function classifyBlock(block: any): { type: 'text' | 'visual'; subType: string } {
  const content = (block.content || '').trim()
  const lowContent = content.toLowerCase()
  const confidence = block.confidence_score !== undefined ? block.confidence_score : 1.0

  // 1. Quality rule: low confidence or scientific notations route directly to visual crops
  const hasScientificNotation = /\\Delta|\\sigma|\\pi|\\mu|\\alpha|\\beta|\\gamma|\\rightarrow|\\leftarrow|\\rightleftharpoons|\\leq|\\geq|⇌|⇌|→|⇌|≤|≥|Δ|σ|π|μ|α|β|γ|\\sum|\\int|\\matrix|_\{?\d+\}?|\^\{?\d+\}?|Zeff/i.test(content)
  
  if (confidence < 0.75 && hasScientificNotation) {
    return { type: 'visual', subType: 'Formula' }
  }

  if (confidence < 0.65) {
    return { type: 'visual', subType: 'Handwritten Annotation' }
  }
  
  const x1 = block.top_left_x ?? 0
  const y1 = block.top_left_y ?? 0
  const x2 = block.bottom_right_x ?? 0
  const y2 = block.bottom_right_y ?? 0
  const width = x2 - x1
  const height = y2 - y1
  const aspectRatio = width / (height || 1)

  // 1. Table classification
  if (block.type === 'table') {
    return { type: 'visual', subType: 'Table' }
  }

  // 2. Equation/Formula classification
  if (block.type === 'equation') {
    if (content.length < 50 && aspectRatio > 4) {
      return { type: 'visual', subType: 'Formula' }
    }
    return { type: 'visual', subType: 'Mathematical Equation' }
  }

  // 3. Image block classification (geometry & metadata heuristics)
  if (block.type === 'image') {
    const isChemistry = /C\d+|H\d+|O\d+|[=-]#|\\rightarrow|\\benzene|ring|bond|valence|reaction/i.test(content)
    const isCircuit = /resistor|capacitor|inductor|voltage|current|circuit|diode|transistor|ground/i.test(content)
    const isFlowchart = /flowchart|process|step|start|end|decision|arrow/i.test(content)
    const isGraph = /axis|axes|graph|plot|versus|vs|curve|coordinate|x-axis|y-axis/i.test(content)
    
    // Low confidence indicates handwriting or low-contrast drawings
    const confidence = block.confidence_score !== undefined ? block.confidence_score : 1.0
    if (confidence < 0.40) {
      return { type: 'visual', subType: 'Handwritten Annotation' }
    }

    if (isCircuit) return { type: 'visual', subType: 'Circuit Diagram' }

    if (isChemistry) {
      if (lowContent.includes('mechanism') || lowContent.includes('reaction')) {
        return { type: 'visual', subType: 'Reaction Mechanism' }
      }
      if (lowContent.includes('structure') || lowContent.includes('lewis')) {
        return { type: 'visual', subType: 'Lewis Structure' }
      }
      return { type: 'visual', subType: 'Chemistry Equation' }
    }
    if (isFlowchart) return { type: 'visual', subType: 'Flowchart' }
    if (isGraph) return { type: 'visual', subType: 'Graph' }

    return { type: 'visual', subType: 'Diagram' }
  }

  // 4. List block classification
  if (block.type === 'list' || /^[*-]\s|^\d+\.\s/i.test(content)) {
    return { type: 'text', subType: 'Bullet List' }
  }

  // 5. Heading/Topic Title classification
  if (
    block.type === 'heading' || 
    (content.length < 80 && (lowContent.startsWith('topic') || lowContent.startsWith('title') || lowContent.startsWith('chapter') || /^[I|V|X]+\.\s/i.test(content)))
  ) {
    if (lowContent.startsWith('topic:') || lowContent.startsWith('title:')) {
      return { type: 'text', subType: 'Topic Title' }
    }
    return { type: 'text', subType: 'Heading' }
  }

  // 6. Definition classification
  const isDefinition = /is defined as|refers to|denotes|means\s+that|definition:|refers\s+to\s+the/i.test(content)
  if (isDefinition && content.length < 300) {
    return { type: 'text', subType: 'Definition' }
  }

  // Fallback to general paragraph
  return { type: 'text', subType: 'Paragraph' }
}

function detectScientific(block: any, classification: { type: 'text' | 'visual'; subType: string }): {
  semanticType: 'Natural Language' | 'Scientific Notation' | 'Mathematical Expression' | 'Chemical Equation / Structure' | 'Scientific Table' | 'Scientific Diagram'
  protectedContent: boolean
} {
  const content = (block.content || '').trim()
  const lowContent = content.toLowerCase()

  // 1. Tables
  if (block.type === 'table' || classification.subType === 'Table') {
    return { semanticType: 'Scientific Table', protectedContent: true }
  }

  // 2. Diagrams/Graphs
  if (
    classification.subType === 'Diagram' ||
    classification.subType === 'Circuit Diagram' ||
    classification.subType === 'Graph' ||
    classification.subType === 'Flowchart'
  ) {
    return { semanticType: 'Scientific Diagram', protectedContent: true }
  }

  // 3. Chemical Equations / Structures
  const isChemistry = /C\d+|H\d+|O\d+|[=-]#|\\benzene|ring|bond|valence|reaction|mechanism|lewis|structure/i.test(content)
  if (classification.subType === 'Reaction Mechanism' || classification.subType === 'Lewis Structure' || classification.subType === 'Chemistry Equation' || isChemistry) {
    return { semanticType: 'Chemical Equation / Structure', protectedContent: true }
  }

  // 4. Mathematical Expressions
  const isMathExpression = /\\sum|\\int|\\matrix|Integral|Calculus|Limit|Matrix|Zeff\s*=\s*Z|E\s*=\s*mc/i.test(content)
  if (classification.subType === 'Mathematical Equation' || block.type === 'equation' || isMathExpression) {
    return { semanticType: 'Mathematical Expression', protectedContent: true }
  }

  // 5. Scientific Notation
  const hasNotation = /\\Delta|\\sigma|\\pi|\\mu|\\alpha|\\beta|\\gamma|\\rightarrow|\\left|\\right|\\leftarrow|\\rightleftharpoons|\\leq|\\geq|⇌|⇌|→|⇌|≤|≥|Δ|σ|π|μ|α|β|γ|_\{?\d+\}?|\^\{?\d+\}?|Zeff/i.test(content)
  if (classification.subType === 'Formula' || hasNotation) {
    return { semanticType: 'Scientific Notation', protectedContent: true }
  }

  // 6. Natural Language
  return { semanticType: 'Natural Language', protectedContent: false }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    const { jobId } = await request.json()
    if (!jobId) {
      return NextResponse.json({ message: 'Missing jobId' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // 1. Fetch job details
    const { data: job, error: jobError } = await adminSupabase
      .from('ocr_jobs')
      .select('*, documents(*)')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ message: 'OCR Job not found' }, { status: 404 })
    }

    if (job.status === 'completed' || job.status === 'processing') {
      return NextResponse.json({ message: 'Job already completed or in progress' })
    }

    // 2. Mark job as processing
    await adminSupabase.from('ocr_jobs').update({ status: 'processing' }).eq('id', jobId)

    // 3. Retrieve PDF from storage
    const document = job.documents
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('pdfs')
      .download(document.storage_path)

    if (downloadError || !fileData) {
      const errMsg = downloadError?.message || 'Download returned empty file data'
      await adminSupabase
        .from('ocr_jobs')
        .update({ status: 'failed', error_message: `Storage download failed: ${errMsg}` })
        .eq('id', jobId)
      return NextResponse.json({ message: `Download failed: ${errMsg}` }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // 4. Run OCR Provider (Mistral)
    const provider = getOCRProvider()
    const ocrResult = await provider.extractText(buffer).catch(async (err) => {
      await adminSupabase
        .from('ocr_jobs')
        .update({ status: 'failed', error_message: `OCR extraction error: ${err.message || err}` })
        .eq('id', jobId)
      throw err
    })

    // Create a public storage bucket for asset crops if it doesn't exist
    await adminSupabase.storage.createBucket('assets', { public: true }).catch(() => {})

    const allDocBlocks: DocBlock[] = []
    const rawPagesText: string[] = []

    if (ocrResult.rawData && ocrResult.rawData.pages) {
      for (let pIdx = 0; pIdx < ocrResult.rawData.pages.length; pIdx++) {
        const page = ocrResult.rawData.pages[pIdx]
        const pageDims = page.dimensions || { width: 612, height: 792 }
        
        // Track raw page text for search index
        rawPagesText.push(`--- PAGE ${pIdx + 1} ---\n${page.markdown || ''}`)

        // Process layout blocks
        if (page.blocks && page.blocks.length > 0) {
          for (let bIdx = 0; bIdx < page.blocks.length; bIdx++) {
            const block = page.blocks[bIdx]
            const classification = classifyBlock(block)
            const coords = {
              x1: block.top_left_x ?? 0,
              y1: block.top_left_y ?? 0,
              x2: block.bottom_right_x ?? pageDims.width,
              y2: block.bottom_right_y ?? pageDims.height,
            }

            const scienceInfo = detectScientific(block, classification)

            // Force visual type for all scientific/symbolic notations, graphs, and tables
            const isSymbolic = 
              scienceInfo.semanticType === 'Mathematical Expression' ||
              scienceInfo.semanticType === 'Scientific Notation' ||
              scienceInfo.semanticType === 'Chemical Equation / Structure' ||
              scienceInfo.semanticType === 'Scientific Table' ||
              scienceInfo.semanticType === 'Scientific Diagram' ||
              ['Formula', 'Mathematical Equation', 'Chemistry Equation', 'Reaction Mechanism', 'Circuit Diagram', 'Graph', 'Table'].includes(classification.subType);

            if (isSymbolic) {
              classification.type = 'visual';
              if (classification.subType === 'Paragraph' || classification.subType === 'Bullet List' || classification.subType === 'Heading') {
                if (scienceInfo.semanticType === 'Mathematical Expression') {
                  classification.subType = 'Mathematical Equation';
                } else if (scienceInfo.semanticType === 'Scientific Notation') {
                  classification.subType = 'Formula';
                } else if (scienceInfo.semanticType === 'Chemical Equation / Structure') {
                  classification.subType = 'Chemistry Equation';
                } else if (scienceInfo.semanticType === 'Scientific Table') {
                  classification.subType = 'Table';
                } else {
                  classification.subType = 'Diagram';
                }
              }
            }

            // Compute context-aware coordinates and adaptive padding for visual crops
            let finalCoords = coords
            let padding = 10

            if (classification.type === 'visual') {
              const contextCoords = getContextAwareCoordinates(block, page.blocks || [], pageDims)
              padding = getAdaptivePadding(contextCoords, classification, scienceInfo)

              finalCoords = {
                x1: Math.max(0, contextCoords.x1 - padding),
                y1: Math.max(0, contextCoords.y1 - padding),
                x2: Math.min(pageDims.width, contextCoords.x2 + padding),
                y2: Math.min(pageDims.height, contextCoords.y2 + padding)
              }
            }

            const docBlock: DocBlock = {
              id: crypto.randomUUID(),
              type: classification.type,
              subType: classification.subType,
              content: block.content || '',
              coordinates: finalCoords,
              pageIndex: pIdx,
              semanticType: scienceInfo.semanticType,
              protectedContent: scienceInfo.protectedContent,
            }

            // Crop visual block regions directly from source
            if (classification.type === 'visual' && block.top_left_x !== undefined) {
              try {
                const cropBuffer = document.mime_type?.startsWith('image/')
                  ? await cropImageRegion(buffer, pageDims, finalCoords)
                  : await cropPdfRegion(buffer, pIdx, pageDims, finalCoords)
                const fileName = `users/${document.owner_id}/vaults/${document.vault_id}/assets/${document.id}-${pIdx}-${block.type || 'visual'}-${bIdx}.png`
 
                const { error: uploadErr } = await adminSupabase.storage
                  .from('assets')
                  .upload(fileName, cropBuffer, {
                    contentType: 'image/png',
                    upsert: true,
                  })
 
                if (!uploadErr) {
                  const publicUrl = adminSupabase.storage.from('assets').getPublicUrl(fileName).data.publicUrl
                  docBlock.imageUrl = publicUrl
                }
              } catch (e) {
                console.error(`Failed to crop block ${block.type} at page ${pIdx} index ${bIdx}:`, e)
              }
            }

            allDocBlocks.push(docBlock)
          }
        }

        // Process native base64 images extracted by Mistral (if not already mapped in blocks)
        if (page.images && page.images.length > 0) {
          for (const img of page.images) {
            if (img.image_base64) {
              try {
                let cleanBase64 = img.image_base64.trim()
                if (cleanBase64.startsWith('data:')) {
                  const commaIdx = cleanBase64.indexOf(',')
                  if (commaIdx !== -1) {
                    cleanBase64 = cleanBase64.substring(commaIdx + 1)
                  }
                }
                const imgBuffer = Buffer.from(cleanBase64, 'base64')
                const fileName = `users/${document.owner_id}/vaults/${document.vault_id}/assets/${document.id}-${pIdx}-${img.id}`
                
                const { error: uploadErr } = await adminSupabase.storage
                  .from('assets')
                  .upload(fileName, imgBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                  })
                
                if (!uploadErr) {
                  const publicUrl = adminSupabase.storage.from('assets').getPublicUrl(fileName).data.publicUrl
                  allDocBlocks.push({
                    id: crypto.randomUUID(),
                    type: 'visual',
                    subType: 'Mixed Visual Content',
                    content: img.id,
                    coordinates: { x1: 0, y1: 0, x2: pageDims.width, y2: pageDims.height },
                    imageUrl: publicUrl,
                    pageIndex: pIdx,
                    semanticType: 'Scientific Diagram',
                    protectedContent: false,
                  })
                }
              } catch (e) {
                console.error('Failed to upload native base64 image:', e)
              }
            }
          }
        }
      }
    }

    const cleanRawText = (rawPagesText.length > 0 ? rawPagesText.join('\n\n') : ocrResult.text)
      .replace(/\r\n/g, '\n')
      .trim()

    // 5. Update OCR Job metadata
    // processed_text stores the structured JSON serialization of DocBlocks
    // raw_text stores the clean raw text for search indexing
    const { error: updateJobError } = await adminSupabase
      .from('ocr_jobs')
      .update({
        status: 'completed',
        raw_text: cleanRawText,
        processed_text: JSON.stringify(allDocBlocks),
        page_count: ocrResult.pages,
        confidence_score: ocrResult.confidence * 100,
        error_message: null,
      })
      .eq('id', jobId)

    if (updateJobError) throw updateJobError

    // 6. Update Document details
    const ocrTextHash = crypto.createHash('sha256').update(cleanRawText).digest('hex')
    const { error: updateDocError } = await adminSupabase
      .from('documents')
      .update({
        page_count: ocrResult.pages,
        ocr_text_hash: ocrTextHash,
      })
      .eq('id', document.id)

    if (updateDocError) throw updateDocError

    recordTelemetry('ocr', Date.now() - startTime, { pages: ocrResult.pages })
    return NextResponse.json({
      status: 'success',
      pages: ocrResult.pages,
      confidence: ocrResult.confidence,
    })

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Worker processing error' }, { status: 500 })
  }
}
