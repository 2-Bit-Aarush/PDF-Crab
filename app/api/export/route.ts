import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MarkdownAdapter } from '@/lib/export/markdown'
import { DocxAdapter } from '@/lib/export/docx'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const masterNoteId = searchParams.get('id')
    const format = searchParams.get('format') || 'markdown'

    if (!masterNoteId) {
      return NextResponse.json({ message: 'Missing masterNoteId' }, { status: 400 })
    }

    const { data: note, error: noteError } = await supabase
      .from('master_notes')
      .select('*, note_sections(*)')
      .eq('id', masterNoteId)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ message: 'Master note not found in database' }, { status: 404 })
    }

    const sections = (note.note_sections || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    )

    if (sections.length === 0) {
      return NextResponse.json({ message: 'This notebook contains no content. Please attach sources and run compile first.' }, { status: 400 })
    }

    const noteTitle = note.title || 'untitled-notebook'
    const filename = noteTitle.replace(/\s+/g, '-').toLowerCase()

    // Map database structures to the canonical NotebookViewModel
    const model: { title: string; sections: { heading: string; body: string; metadata?: any }[] } = {
      title: noteTitle,
      sections: sections.map((s: any) => {
        let metadata: any = undefined
        try {
          if (s.ocr_source) {
            metadata = JSON.parse(s.ocr_source)
          }
        } catch (e) {
          // Fallback if parsing fails or column is empty
        }
        return {
          heading: s.heading || 'Untitled Section',
          body: s.body || '',
          metadata,
        }
      }),
    }

    if (format === 'markdown' || format === 'md') {
      const adapter = new MarkdownAdapter()
      const markdown = await adapter.transform(model)
      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.md"`,
        },
      })
    }

    if (format === 'docx') {
      const adapter = new DocxAdapter()
      const docxHtml = await adapter.transform(model)
      return new Response(docxHtml, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename="${filename}.doc"`,
        },
      })
    }

    if (format === 'pdf') {
      // Dynamic import - only loads pdfkit when PDF format is requested
      const { PDFAdapter } = await import('@/lib/export/pdf')
      const adapter = new PDFAdapter()
      const pdfBuffer = await adapter.transform(model)
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      })
    }

    return NextResponse.json({ message: 'Unsupported format' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Export failed' }, { status: 500 })
  }
}