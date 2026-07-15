import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerCompileJob } from '@/lib/workers/background-worker'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
    }

    const { masterNoteId } = await request.json()
    if (!masterNoteId) {
      return NextResponse.json({ message: 'Missing masterNoteId' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // 1. Fetch note
    const { data: note, error: noteError } = await adminSupabase
      .from('master_notes')
      .select('id, vault_id')
      .eq('id', masterNoteId)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ message: 'Master note not found' }, { status: 404 })
    }

    // 2. Fetch documents inside that vault
    const { data: docs, error: docsError } = await adminSupabase
      .from('documents')
      .select('id')
      .eq('vault_id', note.vault_id)

    if (docsError) {
      return NextResponse.json({ message: `Database error: ${docsError.message}` }, { status: 500 })
    }

    if (!docs || docs.length === 0) {
      return NextResponse.json({ message: 'Cannot compile a vault with no source documents attached' }, { status: 400 })
    }

    // 3. Register Compile Job
    const { data: compileJob, error: compileJobError } = await adminSupabase
      .from('compile_jobs')
      .insert({
        master_note_id: note.id,
        status: 'queued',
        phase: 'Indexing Sources',
        progress: 0,
      })
      .select()
      .single()

    if (compileJobError) {
      return NextResponse.json({ message: `Failed to enqueue compile job: ${compileJobError.message}` }, { status: 500 })
    }

    // 4. Trigger worker asynchronously
    const { origin } = new URL(request.url)
    triggerCompileJob(compileJob.id, origin)

    return NextResponse.json({
      status: 'success',
      compileJobId: compileJob.id,
      message: 'Compilation triggered. Worker queued.',
    })

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Worker compile queue error' }, { status: 500 })
  }
}
