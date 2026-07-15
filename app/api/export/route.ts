import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'

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
      return NextResponse.json({ message: 'Master note not found' }, { status: 404 })
    }

    const sections = (note.note_sections || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    )
    const filename = note.title.replace(/\s+/g, '-').toLowerCase()

    if (format === 'markdown' || format === 'md') {
      const markdown =
        `# ${note.title}\n\n` +
        sections.map((s: any) => `## ${s.heading}\n\n${s.body}`).join('\n\n')
      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.md"`,
        },
      })
    }

    if (format === 'txt') {
      const txt =
        `${note.title}\n\n` + sections.map((s: any) => `${s.heading}\n\n${s.body}`).join('\n\n')
      return new Response(txt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.txt"`,
        },
      })
    }

    if (format === 'docx') {
      const docxHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${note.title}</title>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; }
h1 { color: #000; font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
h2 { color: #333; font-size: 18px; margin-top: 20px; }
p { margin-bottom: 15px; }
</style>
</head>
<body>
<h1>${note.title}</h1>
${sections.map((s: any) => `<h2>${s.heading}</h2><p>${s.body.replace(/\n/g, '<br>')}</p>`).join('\n')}
</body>
</html>
`
      return new Response(docxHtml, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename="${filename}.doc"`,
        },
      })
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: any[] = []

      doc.on('data', (chunk) => chunks.push(chunk))

      doc.font('Helvetica-Bold').fontSize(26).text(note.title)
      doc.moveDown(1.5)

      for (const s of sections) {
        doc.font('Helvetica-Bold').fontSize(16).text(s.heading)
        doc.moveDown(0.5)
        doc.font('Helvetica').fontSize(11).text(s.body, { align: 'justify', lineGap: 3 })
        doc.moveDown(1.5)
      }

      doc.end()

      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
      })

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
