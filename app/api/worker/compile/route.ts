import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GroqAIProvider } from '@/lib/ai/groq'
import { recordTelemetry } from '@/lib/dev-logger'
import { buildCompilerSystemPrompt } from '@/lib/ai/compiler-rules'

export async function POST(request: Request) {
  const startTime = Date.now()
  let compileJobId: string | null = null

  try {
    const body = await request.json()
    compileJobId = body.jobId

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
    const documentsText: { docId: string; name: string; text: string; checksum: string }[] = []
    let totalPages = 0

    for (const doc of docs) {
      const { data: ocrJob } = await adminSupabase
        .from('ocr_jobs')
        .select('*')
        .eq('document_id', doc.id)
        .eq('status', 'completed')
        .maybeSingle()

      if (ocrJob?.processed_text) {
        documentsText.push({
          docId: doc.id,
          name: doc.name,
          text: ocrJob.processed_text,
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
            documentsText.push({
              docId: doc.id,
              name: doc.name,
              text: ocrResult.text,
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

    // 4. Align & Extract Sources (Knowledge Alignment)
    await transitionState('Comparing Information', 65)
    const provider = new GroqAIProvider()
    const alignedKnowledge: string[] = []
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for (const doc of documentsText) {
      // Chunk size around 4000 characters
      const chunks = doc.text.match(/[\s\S]{1,4000}/g) || [doc.text]
      const chunkSegments: string[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunkPrompt = `Extract and align the academic knowledge from this text segment of the source document "${doc.name}" (part ${i + 1}/${chunks.length}) for compilation. Preserve all definitions, examples, procedures, technical terms, derivations, proofs, formulas, names, headings, equations, and tables verbatim. Do not shorten or omit explanations; capture all details.\n\nText:\n${chunks[i]}`
        const res = await provider.complete(chunkPrompt, buildCompilerSystemPrompt('You are an elite academic knowledge compiler. You do not summarize; you extract and structure all information precisely, preserving all technical details and wording.'))
        chunkSegments.push(res.text)
        totalInputTokens += res.inputTokens
        totalOutputTokens += res.outputTokens
      }

      alignedKnowledge.push(`Document: "${doc.name}"\nExtracted Content:\n${chunkSegments.join('\n')}`)
    }

    // 5. Compile Compiled Document / Master Note (Knowledge Alignment & Compilation)
    await transitionState('Building Knowledge Graph', 85)
    const mergedSegments = alignedKnowledge.join('\n\n---\n\n')

    const compilePrompt = `You are PDF-Crab, a premium academic knowledge compiler.
We have extracted and aligned the detailed knowledge segments from the documents in this research vault.
Compile a single, unified, comprehensive Compiled Document (user-facing: Master Note).

Instructions:
- Merge multiple documents into one authoritative master document representing the union of all source knowledge.
- Only remove duplicated information. If two explanations or concepts complement one another, combine them into one comprehensive explanation without losing information.
- Never intentionally shorten explanations or simplify concepts. When uncertain, preserve information.
- Group contents into logical chapters or heading blocks.
- Every major section should begin with a markdown header: ## [Section Heading Title]
- Do NOT output extra text or chat wrappers. Start directly with the first heading.
- Preserve formulas, derivations, definitions, proofs, examples, procedures, and technical terminology verbatim.
- Maintain source traceability.

Source documents content:\n${mergedSegments}`

    const finalRes = await provider.complete(compilePrompt, buildCompilerSystemPrompt('You are an expert academic compiler. Output clean Markdown only. Do not summarize or shorten contents.'))
    totalInputTokens += finalRes.inputTokens
    totalOutputTokens += finalRes.outputTokens

    // 6. Save Versioned master note and sections (Compiling Master Note)
    await transitionState('Compiling Master Note', 100)

    // Calculate version number
    const { data: previousNotes } = await adminSupabase
      .from('master_notes')
      .select('version')
      .eq('vault_id', vaultId)
      .eq('title', note.title)
      .order('version', { ascending: false })

    const nextVersion = previousNotes && previousNotes.length > 0 ? previousNotes[0].version + 1 : 1

    // Mark previous active version records as inactive
    await adminSupabase
      .from('master_notes')
      .update({ active: false })
      .eq('vault_id', vaultId)
      .eq('title', note.title)

    // Insert new version
    const sourceHashes = documentsText.map((d) => d.checksum)

    const { data: newNote, error: insertNoteError } = await adminSupabase
      .from('master_notes')
      .insert({
        vault_id: vaultId,
        title: note.title,
        coverage: 100,
        generated: true,
        version: nextVersion,
        ai_model: 'llama-3.3-70b-versatile',
        ocr_provider: 'google-vision',
        source_document_hashes: sourceHashes,
        active: true,
      })
      .select()
      .single()

    if (insertNoteError) throw insertNoteError

    // Parse Sections
    const sectionsList: { heading: string; body: string }[] = []
    const headingRegex = /^##\s+(.+)$/gm
    const splitContent = finalRes.text.split(headingRegex)

    if (splitContent[0] && splitContent[0].trim()) {
      sectionsList.push({ heading: 'Overview', body: splitContent[0].trim() })
    }

    for (let i = 1; i < splitContent.length; i += 2) {
      const heading = splitContent[i].trim()
      const body = splitContent[i + 1]?.trim() || ''
      if (heading) {
        sectionsList.push({ heading, body })
      }
    }

    // Insert Sections
    for (let idx = 0; idx < sectionsList.length; idx++) {
      const s = sectionsList[idx]
      await adminSupabase.from('note_sections').insert({
        master_note_id: newNote.id,
        heading: s.heading,
        body: s.body,
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
      ocr_provider: 'google-vision',
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
