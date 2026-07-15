import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerOCRJob } from '@/lib/workers/background-worker'
import { recordTelemetry } from '@/lib/dev-logger'

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reuseParam = searchParams.get('reuse') === 'true'

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const vaultId = formData.get('vaultId') as string | null
    const masterNoteId = formData.get('masterNoteId') as string | null

    if (!file || !vaultId) {
      return NextResponse.json({ message: 'Missing file or vaultId' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // 1. Validate File Size (Max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // 2. Validate File Signatures (Magic Bytes)
    const hex = buffer.slice(0, 8).toString('hex').toUpperCase()
    let isValid = false
    let isPdf = false

    if (hex.startsWith('25504446')) {
      // %PDF
      isValid = true
      isPdf = true
    } else if (hex.startsWith('89504E470D0A1A0A')) {
      // PNG
      isValid = true
    } else if (hex.startsWith('FFD8FF')) {
      // JPEG
      isValid = true
    } else if (hex.startsWith('47494638')) {
      // GIF
      isValid = true
    }

    if (!isValid) {
      return NextResponse.json({ message: 'Unsupported file signature (executables and non-images/PDFs are rejected)' }, { status: 400 })
    }

    // 3. Check for Encrypted/Password-protected PDFs
    if (isPdf) {
      const startString = buffer.slice(0, 1024).toString('ascii')
      const endString = buffer.slice(buffer.length - 4096).toString('ascii')
      if (startString.includes('/Encrypt') || endString.includes('/Encrypt')) {
        return NextResponse.json({ message: 'Password-protected or encrypted PDFs are rejected' }, { status: 400 })
      }
    }

    // 4. Calculate SHA-256 Checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex')

    // 5. Check for Existing Duplicate Checksum
    const { data: existingDoc, error: checkError } = await supabase
      .from('documents')
      .select('id, name, vault_id, storage_path, size, mime_type, page_count')
      .eq('checksum', checksum)
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ message: `Database error: ${checkError.message}` }, { status: 500 })
    }

    const adminSupabase = createAdminClient()

    if (existingDoc) {
      if (reuseParam) {
        // Reuse: link existing document metadata to the new vault
        const { data: newDoc, error: linkError } = await adminSupabase
          .from('documents')
          .insert({
            vault_id: vaultId,
            name: file.name,
            storage_path: existingDoc.storage_path,
            size: existingDoc.size,
            mime_type: existingDoc.mime_type,
            page_count: existingDoc.page_count,
            checksum: checksum,
            owner_id: user.id,
          })
          .select()
          .single()

        if (linkError) {
          return NextResponse.json({ message: `Re-linking failed: ${linkError.message}` }, { status: 500 })
        }

        // Queue a fast OCR validation check or just return success
        recordTelemetry('upload', Date.now() - startTime, { reused: true })
        return NextResponse.json({
          status: 'success',
          reused: true,
          documentId: newDoc.id,
          message: 'Existing archive resource linked successfully',
        })
      } else {
        // Offer reuse to client
        return NextResponse.json({
          status: 'duplicate',
          documentId: existingDoc.id,
          message: `File already exists as "${existingDoc.name}". Reuse resource?`,
        }, { status: 409 })
      }
    }

    // 6. Ensure storage buckets exist
    const { error: bucketError } = await adminSupabase.storage.createBucket('pdfs', {
      public: false,
    }).catch(() => ({ error: null })) // Ignore if exists

    // 7. Write payload to storage
    const fileId = crypto.randomUUID()
    const storagePath = `users/${user.id}/vaults/${vaultId}/${fileId}-${file.name}`

    const { error: storageError } = await adminSupabase.storage
      .from('pdfs')
      .upload(storagePath, buffer, {
        contentType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
        upsert: true,
      })

    if (storageError) {
      return NextResponse.json({ message: `Storage upload failed: ${storageError.message}` }, { status: 500 })
    }

    // 8. Register document record
    const { data: doc, error: insertError } = await adminSupabase
      .from('documents')
      .insert({
        id: fileId,
        vault_id: vaultId,
        name: file.name,
        storage_path: storagePath,
        size: buffer.length,
        mime_type: file.type || (isPdf ? 'application/pdf' : 'image/png'),
        page_count: 1, // Default, will update in OCR worker
        checksum,
        owner_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ message: `Document registration failed: ${insertError.message}` }, { status: 500 })
    }

    // 9. Enqueue OCR Job
    const { data: ocrJob, error: ocrJobError } = await adminSupabase
      .from('ocr_jobs')
      .insert({
        document_id: doc.id,
        status: 'queued',
        retry_count: 0,
      })
      .select()
      .single()

    if (ocrJobError) {
      return NextResponse.json({ message: `OCR enqueue failed: ${ocrJobError.message}` }, { status: 500 })
    }

    // 10. Trigger worker asynchronously
    const { origin } = new URL(request.url)
    triggerOCRJob(ocrJob.id, origin)

    recordTelemetry('upload', Date.now() - startTime, { reused: false })
    return NextResponse.json({
      status: 'success',
      documentId: doc.id,
      ocrJobId: ocrJob.id,
      message: 'Upload succeeded. OCR queued.',
    }, { status: 202 })

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 })
  }
}
