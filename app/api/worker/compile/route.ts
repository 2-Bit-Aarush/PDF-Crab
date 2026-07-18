import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { GroqAIProvider } from '@/lib/ai/groq'
import { recordTelemetry } from '@/lib/dev-logger'
import { buildCompilerSystemPrompt } from '@/lib/ai/compiler-rules'
import * as fs from 'fs'
import * as path from 'path'
import { AssetResolver } from '@/lib/export/resolver'

function resolveImageAssetUrl(imgUrl: string, docs: any[]): string {
  if (!imgUrl) return ''
  const trimmed = imgUrl.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  const numMatch = trimmed.match(/\d+/)
  const cleanName = trimmed.toLowerCase()

  const allUrls: string[] = []
  for (const doc of docs) {
    if (doc.blocks) {
      for (const block of doc.blocks) {
        if (block.imageUrl) {
          allUrls.push(block.imageUrl)
        }
      }
    }
  }

  if (numMatch) {
    const index = parseInt(numMatch[0]) - 1
    if (index >= 0 && index < allUrls.length) {
      return allUrls[index]
    }
  }

  for (const url of allUrls) {
    const urlLower = url.toLowerCase()
    const urlBasename = urlLower.split('/').pop() || ''
    if (urlLower.includes(cleanName) || cleanName.includes(urlBasename)) {
      return url
    }
  }

  if (allUrls.length > 0) {
    return allUrls[0]
  }

  return imgUrl
}

async function resolveAndCacheAsset(imageUrl: string, adminSupabase: any): Promise<any> {
  const randomId = () => Math.random().toString(36).substring(2, 15)
  if (!imageUrl) {
    return {
      id: randomId(),
      storageKey: '',
      publicUrl: '',
      signedUrl: '',
      localPath: '',
      width: 150,
      height: 150,
      mimeType: 'image/png'
    }
  }

  const trimmed = imageUrl.trim()
  const isSupabaseUrl = trimmed.includes('supabase.co/storage/v1/object/')

  // Extract storage key from URL
  let storageKey = trimmed
  if (isSupabaseUrl) {
    const storagePathIndex = trimmed.indexOf('/public/assets/');
    if (storagePathIndex !== -1) {
      storageKey = trimmed.substring(storagePathIndex + '/public/assets/'.length);
    }
  }

  const safeFilename = storageKey.replace(/\//g, '_')
  let publicDir = path.join(process.cwd(), 'public');
  const absoluteCrabPath = 'C:\\Users\\DELL\\OneDrive\\Documents\\Projects\\PDF-Crab\\public';
  if (fs.existsSync(absoluteCrabPath)) {
    publicDir = absoluteCrabPath;
  }
  const localDir = path.join(publicDir, 'temp-crops')
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true })
  }
  const localFilePath = path.join(localDir, safeFilename)
  const webPath = `/temp-crops/${safeFilename}`

  let buffer: Buffer | null = null

  // Ensure file exists locally or download it
  if (fs.existsSync(localFilePath)) {
    try {
      buffer = fs.readFileSync(localFilePath)
    } catch (e) {
      console.error('Failed to read cached file:', e)
    }
  }

  if (!buffer) {
    try {
      console.log(`resolveAndCacheAsset: Downloading storageKey: ${storageKey}`);
      const { data, error } = await adminSupabase.storage.from('assets').download(storageKey)
      if (!error && data) {
        buffer = Buffer.from(await data.arrayBuffer())
        fs.writeFileSync(localFilePath, buffer)
        console.log(`resolveAndCacheAsset: Successfully saved ${safeFilename} (${buffer.length} bytes)`);
      } else if (error) {
        console.error(`Failed to download storageKey: ${storageKey} - ${error.message}`)
      }
    } catch (e) {
      console.error(`Error downloading asset from storage:`, e)
    }
  }

  // Parse dimensions and mimeType
  let width = 300
  let height = 150
  let mimeType = 'image/png'

  if (buffer) {
    const info = AssetResolver.validateImage(buffer)
    if (info.valid) {
      width = info.width
      height = info.height
      mimeType = info.contentType
    }
  }

  // Generate signed URL
  let signedUrl = trimmed
  try {
    const { data: signedData, error: signedError } = await adminSupabase.storage
      .from('assets')
      .createSignedUrl(storageKey, 31536000) // 1 year
    if (!signedError && signedData) {
      signedUrl = signedData.signedUrl
    }
  } catch (e) {
    console.error('Failed to generate signed URL:', e)
  }

  return {
    id: randomId(),
    storageKey,
    publicUrl: trimmed,
    signedUrl,
    localPath: webPath,
    width,
    height,
    mimeType
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let compileJobId: string | null = null

  try {
    const body = await request.json()
    compileJobId = body.jobId
    const compileMode = body.mode || 'notebook'

    if (!compileJobId) {
      return NextResponse.json({ message: 'Missing jobId' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // 1. Fetch Compile Job details
    const { data: job, error: jobError } = await adminSupabase
      .from('compile_jobs')
      .select('*, master_notes(*)')
      .eq('id', compileJobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ message: 'Compile job not found' }, { status: 404 })
    }

    const note = job.master_notes
    const vaultId = note.vault_id

    // Helper state transition function
    const transitionState = async (phase: string, progress: number) => {
      await adminSupabase
        .from('compile_jobs')
        .update({ phase, progress })
        .eq('id', compileJobId!)
    }

    // 2. Fetch Vault Documents
    await transitionState('Indexing Sources', 20)
    const { data: docs, error: docsError } = await adminSupabase
      .from('documents')
      .select('*')
      .eq('vault_id', vaultId)

    if (docsError || !docs || docs.length === 0) {
      const errMsg = docsError?.message || 'No source documents found'
      throw new Error(`Indexing failed: ${errMsg}`)
    }

    // 3. Retrieve OCR Content for each document
    await transitionState('Reading Documents', 45)
    const documentsText: { docId: string; name: string; text: string; blocks: any[]; checksum: string }[] = []
    let totalPages = 0
    const randomId = () => Math.random().toString(36).substring(2, 15)

    for (const doc of docs) {
      const { data: ocrJob } = await adminSupabase
        .from('ocr_jobs')
        .select('*')
        .eq('document_id', doc.id)
        .eq('status', 'completed')
        .maybeSingle()

      if (ocrJob?.processed_text) {
        let rawContent = ocrJob.processed_text
        let blocksList: any[] = []
        try {
          const parsed = JSON.parse(ocrJob.processed_text)
          if (Array.isArray(parsed)) {
            blocksList = parsed
            rawContent = parsed
              .map((b: any) => {
                if (b.type === 'visual') {
                  const label = b.subType === 'Mathematical Equation' ? 'Source Equation' : b.subType === 'Table' ? 'Source Table' : 'Source Image'
                  return `![${label}](${b.imageUrl || ''})`
                }
                return b.content
              })
              .join('\n\n')
          }
        } catch (e) {
          // Fallback: wrap raw content as a Paragraph block
          blocksList = [
            {
              id: randomId(),
              type: 'text',
              subType: 'Paragraph',
              content: ocrJob.processed_text || ocrJob.raw_text || '',
              coordinates: { x1: 0, y1: 0, x2: 600, y2: 800 },
              pageIndex: 0
            }
          ]
        }

        documentsText.push({
          docId: doc.id,
          name: doc.name,
          text: rawContent,
          blocks: blocksList,
          checksum: doc.checksum || '',
        })
        totalPages += ocrJob.page_count || 1
      } else {
        // Fallback: trigger OCR inline if missing
        const { data: fileData, error: downloadError } = await adminSupabase.storage
          .from('pdfs')
          .download(doc.storage_path)

        if (!downloadError && fileData) {
          const buffer = Buffer.from(await fileData.arrayBuffer())
          const { getOCRProvider } = await import('@/lib/ocr/provider')
          const ocrProvider = getOCRProvider()
          const ocrResult = await ocrProvider.extractText(buffer).catch(() => null)
          if (ocrResult) {
            const fallbackBlocks = [
              {
                id: randomId(),
                type: 'text',
                subType: 'Paragraph',
                content: ocrResult.text,
                coordinates: { x1: 0, y1: 0, x2: 600, y2: 800 },
                pageIndex: 0
              }
            ]
            documentsText.push({
              docId: doc.id,
              name: doc.name,
              text: ocrResult.text,
              blocks: fallbackBlocks,
              checksum: doc.checksum || '',
            })
            totalPages += ocrResult.pages
            // Save it
            await adminSupabase.from('ocr_jobs').insert({
              document_id: doc.id,
              status: 'completed',
              processed_text: ocrResult.text,
              raw_text: ocrResult.text,
              page_count: ocrResult.pages,
              confidence_score: ocrResult.confidence * 100,
            })
          }
        }
      }
    }

    if (documentsText.length === 0) {
      throw new Error('All source document text inputs are empty or missing OCR annotations')
    }

    // 4. Align & Extract Sources (Knowledge Alignment) - Stage 2: Knowledge Graph & Topic Intelligence
    await transitionState('Comparing Information', 65)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
    const allLocalKGs: { documentName: string; topics: any[]; relationships: any[] }[] = []
    
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for (const doc of documentsText) {
      // Prepare compact block input for LLM to stay within token limits
      const blocksForExtraction = doc.blocks.map((b: any) => ({
        type: b.type,
        subType: b.subType,
        content: b.content.slice(0, 1000), // truncate extremely long blocks if any
        imageUrl: b.imageUrl,
        page: b.pageIndex + 1,
        semanticType: b.semanticType || 'Natural Language',
        protectedContent: b.protectedContent || false,
      }))

      const modeInstruction = compileMode === 'notebook'
        ? `You are compiling in Notebook Mode. Extract content verbatim. Preserve all formulas, symbols, and chemical trends (e.g. F > O > N) exactly as they are written in the blocks. Do not rewrite, paraphrase, or expand concise notes into textbook paragraphs. If a topic is concise, keep it concise. Original wording has higher priority than generated wording.`
        : `You are compiling in Explanation Mode. Extract detailed definitions, explanations, examples, and formulas. Retain all technical terms and notations. Combine descriptions and expand concepts with clear textbook definitions and detailed explanations to improve readability.`

      const kgPrompt = `Analyze the structural blocks of the source document "${doc.name}" and construct a detailed academic Knowledge Graph.

Instructions:
${modeInstruction}

Document blocks:
${JSON.stringify(blocksForExtraction)}

You must return a JSON object strictly matching this schema:
{
  "topics": [
    {
      "name": "Topic Name",
      "definition": "Write the verbatim definition text if present in the blocks. If not present, keep it empty.",
      "explanation": "Provide the detailed explanation, retaining all technical terms, trends, exceptions, and formulas from the text blocks.",
      "importantPoints": ["Key point 1", "Key point 2"],
      "examples": ["worked examples or applications from the text blocks"],
      "visualAssets": [
        {
          "subType": "Mathematical Equation | Chemistry Equation | Table | Diagram | Flowchart | Graph | ...",
          "imageUrl": "URL of the visual block crop"
        }
      ],
      "pages": [1] // Page numbers (1-indexed) where this topic is discussed
    }
  ],
  "relationships": [
    {
      "source": "Topic Name",
      "target": "Prerequisite Topic Name",
      "type": "prerequisite"
    }
  ]
}`

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an elite academic compiler. You extract structured knowledge graphs in JSON format. Do not summarize or simplify explanations.',
            },
            { role: 'user', content: kgPrompt },
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          temperature: 0.1,
        })

        const content = chatCompletion.choices[0]?.message?.content || '{}'
        totalInputTokens += chatCompletion.usage?.prompt_tokens || 0
        totalOutputTokens += chatCompletion.usage?.completion_tokens || 0

        const kgResult = JSON.parse(content)
        allLocalKGs.push({
          documentName: doc.name,
          topics: kgResult.topics || [],
          relationships: kgResult.relationships || [],
        })
      } catch (err: any) {
        console.error(`Failed to extract Knowledge Graph for ${doc.name}:`, err)
        // Fallback simple single topic for the document if it fails
        allLocalKGs.push({
          documentName: doc.name,
          topics: [
            {
              name: doc.name.replace(/\.[^/.]+$/, ''),
              definition: '',
              explanation: doc.text,
              importantPoints: [],
              examples: [],
              visualAssets: [],
              pages: [1],
            },
          ],
          relationships: [],
        })
      }
    }

    // 5. Compile Compiled Document / Master Note (Topic Intelligence Engine)
    await transitionState('Building Knowledge Graph', 85)

    const tiePrompt = `You are the Topic Intelligence Engine for PDF-Crab.
We have extracted the local Knowledge Graphs from all source documents in this vault.
Your responsibilities:
1. Identify all unique topics discussed.
2. Group related concepts together into unified global topics.
3. Detect prerequisite relationships and resolve a logical pedagogical sequence (foundational topics first, followed by dependent topics).
4. For each topic, rank the importance of information (give higher weight to verbatim definitions, trends, exceptions, examples, and visual assets).
5. Output the structured pedagogical sequence.

Local Knowledge Graphs:
${JSON.stringify(allLocalKGs)}

Return a JSON object matching this schema:
{
  "sequence": [
    {
      "name": "Topic Name",
      "prerequisites": ["Prerequisite Topic 1"],
      "importanceRank": 1,
      "coreConcepts": ["Concept A", "Concept B"]
    }
  ]
}`

    let sequence: { name: string; prerequisites: string[]; importanceRank: number; coreConcepts: string[] }[] = []

    try {
      const tieCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are the Topic Intelligence Engine. Resolve pedagogical orderings and group related concepts into JSON.',
          },
          { role: 'user', content: tiePrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.1,
      })

      const tieContent = tieCompletion.choices[0]?.message?.content || '{}'
      totalInputTokens += tieCompletion.usage?.prompt_tokens || 0
      totalOutputTokens += tieCompletion.usage?.completion_tokens || 0

      const tieResult = JSON.parse(tieContent)
      sequence = tieResult.sequence || []
    } catch (err: any) {
      console.error('Topic Intelligence Engine failed, using direct topics merge:', err)
      // Fallback sequence from local topics list directly
      const uniqueNames = new Set<string>()
      for (const lg of allLocalKGs) {
        for (const t of lg.topics) {
          if (t.name) uniqueNames.add(t.name)
        }
      }
      sequence = Array.from(uniqueNames).map((name, idx) => ({
        name,
        prerequisites: [],
        importanceRank: idx + 1,
        coreConcepts: [],
      }))
    }

    // 6. Save Versioned master note and sections (Topic Builder & Notebook Renderer)
    await transitionState('Compiling Master Note', 100)

    const nextVersion = note.version || 1
    const sourceHashes = documentsText.map((d) => d.checksum)

    // Delete existing compiled note_sections of the master note first to prevent duplicates/conflicts
    await adminSupabase.from('note_sections').delete().eq('master_note_id', note.id)

    // Update the existing master note record in place
    const { data: newNote, error: updateNoteError } = await adminSupabase
      .from('master_notes')
      .update({
        coverage: 100,
        generated: true,
        ai_model: 'llama-3.3-70b-versatile',
        ocr_provider: 'mistral-ocr-latest',
        source_document_hashes: sourceHashes,
        active: true,
      })
      .eq('id', note.id)
      .select()
      .single()

    if (updateNoteError) throw updateNoteError

    const mergeModeInstruction = compileMode === 'notebook'
      ? `You are merging in Notebook Mode. Maintain the student's original wording and notes personality. Do not expand bullets into paragraphs or write introductory/concluding filler text. Reorganize and align the topics pedagogically, but preserve verbatim wording (e.g. trends like F > O > N) with highest priority. Original wording has higher priority than generated wording.`
      : `You are merging in Explanation Mode. Combine descriptions, expand concepts with clear textbook definitions and detailed explanations to improve readability.`

    // Cross-Document Merge & Study Intelligence Engine
    const mergePrompt = `You are the Cross-Document Merge Engine and Study Intelligence Engine for PDF-Crab.
We have extracted the local Knowledge Graphs from multiple source documents in this vault.
Merge them into one Unified Topic Graph representing the entire vault and enrich them with Study Intelligence metadata.

Local Knowledge Graphs:
${JSON.stringify(allLocalKGs)}

Instructions:
1. Merge topics with the same semantic meaning (e.g., "Electronegativity", "Electro-negativity", "Electronegativity Trend") into a single topic node.
2. For each merged topic:
   - ${mergeModeInstruction}
   - Pick the best verbatim definition from the sources. Fix only obvious typos; do not rewrite or invent a new definition.
   - Merge explanations by combining unique insights and removing duplicate sentences.
   - Combine important points by taking their union, removing exact duplicates.
   - Keep ALL useful examples from all sources (do not discard any).
   - Keep ALL visual assets (imageUrl, subType, source) from all sources. Never discard or merge visuals.
   - Ensure complete source traceability: every merged sentence, bullet point, example, and image must retain a source citation mapping (document name, page number, block ID).
   - Merge graph relationships (prerequisites, relatedTopics, dependsOn, children).
   - Resolve difficulty.

3. Calculate Study Intelligence Metadata for each topic:
   - "coverage": list of document names discussing this topic, plus a coverage score (percentage of documents discussing it).
   - "completeness": percentage of completeness calculated strictly using these weights:
     - Definition exists: 15%
     - Explanation exists: 20%
     - Formula exists: 15%
     - Diagram exists: 15%
     - Examples exist: 10%
     - Important Points exist: 10%
     - References exist: 10%
     - Topic Coverage (present in multiple docs or is comprehensive): 5%
     (Scale 0-100%). Specify boolean flags for each. Do not penalize trend-only pages unfairly if they fulfill their relevant fields.
   - "importance": importance score based on frequency, dependency degree, number of references, presence in multiple docs (scale 1-10).
   - "confidence": confidence score. Higher when multiple independent sources agree. Lower when only one source discusses it or conflicts exist (scale 1-10).
   - "missingPrerequisites": list of prerequisite concepts that are absent in the vault's documents.
   - "conflicts": list of conflicting definitions, terminology, or trends detected between documents (only report, do not resolve).
   - "studyModes": pre-filtered markdown representations:
     - "revision": contains only Definition + Important Points + Diagram crops.
     - "exam": contains only Definition + Formulas + Examples.
     - "visual": contains only Visual crops and captions.
     - "quickReview": contains only Definition + Formulas.

You must return a JSON object strictly matching this schema:
{
  "topics": [
    {
      "id": "t1",
      "title": "Topic Name",
      "definition": "verbatim definition",
      "explanation": "merged explanation",
      "importantPoints": [
        {
          "text": "Point 1",
          "source": "Document.pdf (Page X, Block ID)"
        }
      ],
      "examples": [
        {
          "text": "Example 1",
          "source": "Document.pdf (Page X, Block ID)"
        }
      ],
      "visualAssets": [
        {
          "subType": "Formula | Diagram | Table | ...",
          "imageUrl": "...",
          "source": "Document.pdf (Page X, Block ID)"
        }
      ],
      "pageReferences": [1, 2],
      "prerequisites": ["Dependent Topic Name"],
      "relatedTopics": [],
      "dependsOn": [],
      "children": [],
      "difficulty": "Easy | Medium | Hard",
      "importanceScore": 8,
      "studyIntelligence": {
        "coverage": {
          "score": 100,
          "documents": ["Document1.pdf", "Document2.pdf"]
        },
        "completeness": {
          "percentage": 85,
          "hasDefinition": true,
          "hasExplanation": true,
          "hasExamples": true,
          "hasFormula": true,
          "hasDiagram": true,
          "hasImportantPoints": true,
          "hasSourceReferences": true
        },
        "importance": 9,
        "confidence": 8,
        "missingPrerequisites": ["Prerequisite Topic Name"],
        "conflicts": [
          "Conflict details..."
        ],
        "studyModes": {
          "revision": "Markdown text for Revision mode",
          "exam": "Markdown text for Exam mode",
          "visual": "Markdown text for Visual mode",
          "quickReview": "Markdown text for Quick Review mode"
        }
      }
    }
  ]
}`

    let unifiedGraph: any = { topics: [] }

    try {
      const mergeCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are the Cross-Document Merge Engine and Study Intelligence Engine. Merge multiple topic graphs, calculate study metadata, and output JSON.',
          },
          { role: 'user', content: mergePrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.1,
      })

      const mergeContent = mergeCompletion.choices[0]?.message?.content || '{}'
      totalInputTokens += mergeCompletion.usage?.prompt_tokens || 0
      totalOutputTokens += mergeCompletion.usage?.completion_tokens || 0

      unifiedGraph = JSON.parse(mergeContent)
    } catch (err: any) {
      console.error('Merge Engine failed, constructing default graph:', err)
      // Fallback: build simple list of merged topics
      const uniqueNames = new Set<string>()
      for (const lg of allLocalKGs) {
        for (const t of lg.topics) {
          if (t.name) uniqueNames.add(t.name)
        }
      }
      unifiedGraph.topics = Array.from(uniqueNames).map((name) => ({
        id: randomId(),
        title: name,
        definition: '',
        explanation: 'Failed to merge explanations.',
        importantPoints: [],
        examples: [],
        visualAssets: [],
        pageReferences: [1],
        prerequisites: [],
        relatedTopics: [],
        dependsOn: [],
        children: [],
        difficulty: 'Medium',
        importanceScore: 5,
        studyIntelligence: {
          coverage: { score: 50, documents: [] },
          completeness: { percentage: 30, hasDefinition: false, hasExplanation: true, hasExamples: false, hasFormula: false, hasDiagram: false, hasImportantPoints: false, hasSourceReferences: false },
          importance: 5,
          confidence: 5,
          missingPrerequisites: [],
          conflicts: [],
          studyModes: { revision: '', exam: '', visual: '', quickReview: '' }
        }
      }))
    }

    // 7. Notebook Composer, Quality Validation, & Study Intelligence (Stage 4, 5, & Study Intelligence)
    const sectionsList: { heading: string; body: string; ocr_source: string }[] = []

    for (const topic of unifiedGraph.topics) {
      const topicName = topic.title
      let bestDefinition = topic.definition || ''
      let mergedExplanation = topic.explanation || ''
      const points = topic.importantPoints || []
      const examples = topic.examples || []
      const visualAssets = topic.visualAssets || []
      const resolvedVisualSnippets: any[] = []
      for (const asset of visualAssets) {
        if (asset.imageUrl) {
          const resolvedPublicUrl = resolveImageAssetUrl(asset.imageUrl, documentsText)
          const snippetObj = await resolveAndCacheAsset(resolvedPublicUrl, adminSupabase)
          snippetObj.subType = asset.subType || 'Source Image'
          snippetObj.source = asset.source || ''
          resolvedVisualSnippets.push(snippetObj)
          asset.imageUrl = snippetObj.localPath
        }
      }

      // Quality Validation: Focused block scanner if definition is missing
      if (!bestDefinition) {
        for (const doc of documentsText) {
          for (const block of doc.blocks) {
            if (
              (block.subType === 'Definition' || block.content.toLowerCase().includes('is defined as') || block.content.toLowerCase().includes('refers to')) &&
              block.content.toLowerCase().includes(topicName.toLowerCase())
            ) {
              bestDefinition = block.content
              break
            }
          }
        }
      }

      // Notebook View Model Presentation Formatting (only content intended for users!)
      let body = ''

      // Definition
      if (bestDefinition) {
        body += `**Definition**:\n> ${bestDefinition}\n\n`
      } else {
        body += `**Definition**:\n*(No verbatim definition in sources)*\n\n`
      }

      // Explanation
      if (mergedExplanation) {
        body += `**Key Explanation**:\n${mergedExplanation}\n\n`
      }

      // Inline Visual Assets (equations, structures, graphs, tables)
      if (visualAssets.length > 0) {
        body += `**Visual Snippet**:\n`
        body += visualAssets.map((v: any) => {
          const caption = v.subType || 'Source Image'
          const sourceText = v.source ? `\n*Source: ${v.source}*` : ''
          return `![${caption}](${v.imageUrl})${sourceText}`
        }).join('\n\n') + '\n\n'
      }

      // Examples
      if (examples.length > 0) {
        body += `**Example**:\n`
        body += examples.map((ex: any) => {
          const exText = typeof ex === 'object' ? ex.text : ex
          const exSrc = typeof ex === 'object' && ex.source ? `\n*Source: ${ex.source}*` : ''
          return `> ${exText}${exSrc}`
        }).join('\n\n') + '\n\n'
      }

      // Important Points
      if (points.length > 0) {
        body += `**Important Points**:\n`
        body += points.map((p: any) => {
          const pText = typeof p === 'object' ? p.text : p
          const pSrc = typeof p === 'object' && p.source ? ` (Source: ${p.source})` : ''
          return `- ${pText}${pSrc}`
        }).join('\n') + '\n\n'
      }

      // Global page reference citations at the bottom of the section
      const pagesList = topic.pageReferences || []
      const pagesStr = pagesList.length > 0 ? ` (Pages ${pagesList.join(', ')})` : ''
      body += `*Sources: Compiled from source notes${pagesStr}*`

      // Pack structured metadata (Topic Model + Study Intelligence + Graph dependencies)
      // and store in the database ocr_source column rather than embedding in presentation markdown.
      const studyInt = topic.studyIntelligence || {
        coverage: { score: 100, documents: [] },
        completeness: { percentage: 50, hasDefinition: false, hasExplanation: false, hasExamples: false, hasFormula: false, hasDiagram: false, hasImportantPoints: false, hasSourceReferences: false },
        importance: 5,
        confidence: 5,
        missingPrerequisites: [],
        conflicts: [],
        studyModes: { revision: '', exam: '', visual: '', quickReview: '' }
      }

      const structuredPayload = {
        id: topic.id || randomId(),
        title: topicName,
        prerequisites: topic.prerequisites || [],
        relatedTopics: topic.relatedTopics || [],
        difficulty: topic.difficulty || 'Medium',
        importanceScore: topic.importanceScore || 5,
        studyIntelligence: studyInt,
        visualAssets: resolvedVisualSnippets,
      }

      sectionsList.push({
        heading: topicName,
        body,
        ocr_source: JSON.stringify(structuredPayload),
      })
    }

    // Insert Sections (using ocr_source for structured JSON metadata payload)
    for (let idx = 0; idx < sectionsList.length; idx++) {
      const s = sectionsList[idx]
      await adminSupabase.from('note_sections').insert({
        master_note_id: newNote.id,
        heading: s.heading,
        body: s.body,
        ocr_source: s.ocr_source,
        display_order: idx,
        compile_version: nextVersion,
      })
    }

    const compileDuration = (Date.now() - startTime) / 1000

    // Write Compilation Report
    await adminSupabase.from('compilation_reports').insert({
      master_note_id: newNote.id,
      ai_provider: 'groq',
      ai_model: 'llama-3.3-70b-versatile',
      ocr_provider: 'mistral-ocr-latest',
      compile_duration: compileDuration,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      duplicates_removed: 0,
      pages_processed: totalPages,
    })

    // Mark compile job completed
    await adminSupabase
      .from('compile_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration: compileDuration,
      })
      .eq('id', compileJobId)

    recordTelemetry('compile', Date.now() - startTime, { version: nextVersion })
    return NextResponse.json({
      status: 'success',
      noteId: newNote.id,
      version: nextVersion,
      duration: compileDuration,
    })

  } catch (err: any) {
    if (compileJobId) {
      const adminSupabase = createAdminClient()
      await adminSupabase
        .from('compile_jobs')
        .update({
          status: 'failed',
          error_message: err.message || 'Unknown compile error',
        })
        .eq('id', compileJobId)
    }
    return NextResponse.json({ message: err.message || 'Worker compilation error' }, { status: 500 })
  }
}
