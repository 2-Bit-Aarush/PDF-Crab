import { NotebookViewModel, OutputAdapter } from './types'
import { AssetResolver } from './resolver'

export class DocxAdapter implements OutputAdapter<string> {
  async transform(model: NotebookViewModel): Promise<string> {
    let sectionsHtml = ''
    for (const section of model.sections) {
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