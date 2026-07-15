import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q.trim()) {
      return NextResponse.json({
        vaults: [],
        documents: [],
        masterNotes: [],
        ocrMatches: [],
        sectionMatches: [],
      })
    }

    // 1. Search Vault Names
    const { data: vaults } = await supabase
      .from('vaults')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .limit(10)

    // 2. Search PDF Filenames
    const { data: documents } = await supabase
      .from('documents')
      .select('id, name, vault_id')
      .ilike('name', `%${q}%`)
      .limit(10)

    // 3. Search Master Note Titles
    const { data: masterNotes } = await supabase
      .from('master_notes')
      .select('id, title, vault_id')
      .eq('active', true)
      .ilike('title', `%${q}%`)
      .limit(10)

    // 4. Search OCR text
    const { data: ocrJobs } = await supabase
      .from('ocr_jobs')
      .select(`
        document_id,
        raw_text,
        documents (
          id,
          name,
          vault_id
        )
      `)
      .ilike('raw_text', `%${q}%`)
      .limit(10)

    // 5. Search Note Section content & headings
    const { data: sections } = await supabase
      .from('note_sections')
      .select(`
        id,
        heading,
        body,
        master_note_id,
        master_notes (
          id,
          title,
          vault_id
        )
      `)
      .or(`heading.ilike.%${q}%,body.ilike.%${q}%`)
      .limit(15)

    return NextResponse.json({
      vaults: vaults || [],
      documents: documents || [],
      masterNotes: masterNotes || [],
      ocrMatches: (ocrJobs || []).map((o: any) => ({
        documentId: o.document_id,
        name: o.documents?.name || '',
        vaultId: o.documents?.vault_id || '',
        snippet: o.raw_text ? getSnippet(o.raw_text, q) : '',
      })),
      sectionMatches: (sections || []).map((s: any) => ({
        sectionId: s.id,
        heading: s.heading,
        masterNoteId: s.master_note_id,
        masterNoteTitle: s.master_notes?.title || '',
        vaultId: s.master_notes?.vault_id || '',
        snippet: getSnippet(s.body, q),
      })),
    })

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Search execution error' }, { status: 500 })
  }
}

function getSnippet(text: string, query: string, len = 120): string {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text.slice(0, len) + '...'
  const start = Math.max(0, index - 40)
  const end = Math.min(text.length, index + query.length + 80)
  return (start > 0 ? '...' : '') + text.slice(start, end).replace(/\n/g, ' ') + (end < text.length ? '...' : '')
}
