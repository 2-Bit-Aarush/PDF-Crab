import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOCRProvider } from '@/lib/ocr/provider'
import { recordTelemetry } from '@/lib/dev-logger'

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

    // 4. Run OCR Provider
    const provider = getOCRProvider()
    const ocrResult = await provider.extractText(buffer).catch(async (err) => {
      await adminSupabase
        .from('ocr_jobs')
        .update({ status: 'failed', error_message: `GCP Vision API error: ${err.message || err}` })
        .eq('id', jobId)
      throw err
    })

    const cleanText = ocrResult.text
      .replace(/[\r\n]+/g, '\n') // normalize newlines
      .trim()

    const ocrTextHash = crypto.createHash('sha256').update(cleanText).digest('hex')

    // 5. Update OCR Job metadata
    const { error: updateJobError } = await adminSupabase
      .from('ocr_jobs')
      .update({
        status: 'completed',
        raw_text: ocrResult.text,
        processed_text: cleanText,
        page_count: ocrResult.pages,
        confidence_score: ocrResult.confidence * 100,
        error_message: null,
      })
      .eq('id', jobId)

    if (updateJobError) throw updateJobError

    // 6. Update Document details
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
