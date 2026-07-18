import React from 'react'

export function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return []

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []

  const renderInline = (str: string) => {
    const parts: React.ReactNode[] = []
    let key = 0
    let lastIdx = 0

    // Match image: !\[(.*?)\]\((.*?)\), bold: \*\*(.*?)\*\*, italic: \*(.*?)\*, code: `(.*?)`
    const regex = /(!\[(.*?)\]\((.*?)\))|(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)/g
    let match

    while ((match = regex.exec(str)) !== null) {
      const offset = match.index
      if (offset > lastIdx) {
        parts.push(<span key={key++}>{str.substring(lastIdx, offset)}</span>)
      }

      if (match[1]) {
        // Image
        const alt = match[2]
        const url = match[3] ? match[3].trim() : ''

        const isValid = url.startsWith('http://') ||
                        url.startsWith('https://') ||
                        url.startsWith('blob:') ||
                        url.startsWith('data:image/') ||
                        url.startsWith('/')

        if (!isValid) {
          console.warn(`renderMarkdown: Failed to resolve image asset: "${url}". Source is relative or unresolvable.`);
          parts.push(
            <div key={key++} className="my-3 p-4 rounded border border-red-200 bg-red-50 text-red-700 text-xs font-mono text-center max-w-md mx-auto">
              <div>❌ Failed to load image snippet: &quot;{url}&quot;</div>
              <div className="text-[10px] text-red-500 mt-1">Image path must be absolute, a valid URL, local path, or base64 data.</div>
            </div>
          )
        } else {
          parts.push(
            <img
              key={key++}
              src={url}
              alt={alt}
              onError={(e) => {
                console.error(`renderMarkdown image load error for URL: "${url}"`, e);
              }}
              className="my-3 max-w-full max-h-[300px] object-contain rounded border border-border bg-card shadow-sm mx-auto block"
            />
          )
        }
      } else if (match[4]) {
        // Bold
        parts.push(
          <strong key={key++} className="font-semibold text-foreground">
            {match[5]}
          </strong>
        )
      } else if (match[6]) {
        // Italic
        parts.push(
          <em key={key++} className="italic text-foreground/90">
            {match[7]}
          </em>
        )
      } else if (match[8]) {
        // Code
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-secondary/80 border border-border text-xs font-mono text-foreground">
            {match[9]}
          </code>
        )
      }

      lastIdx = regex.lastIndex
    }

    if (lastIdx < str.length) {
      parts.push(<span key={key++}>{str.substring(lastIdx)}</span>)
    }

    return parts
  }

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 my-2 flex flex-col gap-1.5">
          {currentList}
        </ul>
      )
      currentList = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line) {
      flushList()
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold mt-4 mb-2 text-foreground tracking-tight">
          {renderInline(line.substring(4))}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold mt-5 mb-2.5 text-foreground tracking-tight border-b border-border/40 pb-1">
          {renderInline(line.substring(3))}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-bold mt-6 mb-3 text-foreground tracking-tight border-b border-border pb-1">
          {renderInline(line.substring(2))}
        </h1>
      )
    }
    // Lists
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      currentList.push(
        <li key={`li-${i}`} className="text-sm text-foreground/80 leading-relaxed pl-1">
          {renderInline(line.substring(2))}
        </li>
      )
    }
    // Block quotes
    else if (line.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote key={`quote-${i}`} className="pl-4 border-l-2 border-accent/40 italic text-muted-foreground my-2.5 bg-secondary/20 py-1 pr-2 rounded-r">
          {renderInline(line.substring(2))}
        </blockquote>
      )
    }
    // Block images (when the whole line is an image)
    else if (line.startsWith('![') && line.endsWith(')')) {
      flushList()
      const match = /!\[(.*?)\]\((.*?)\)/.exec(line)
      if (match) {
        elements.push(
          <img
            key={`img-${i}`}
            src={match[2]}
            alt={match[1]}
            className="my-3 max-w-full max-h-[400px] object-contain rounded border border-border bg-card shadow-sm mx-auto block"
          />
        )
      } else {
        elements.push(
          <p key={`p-${i}`} className="my-1.5 leading-relaxed text-foreground/85 text-sm">
            {renderInline(line)}
          </p>
        )
      }
    }
    // Paragraph
    else {
      flushList()
      elements.push(
        <p key={`p-${i}`} className="my-1.5 leading-relaxed text-foreground/85 text-sm">
          {renderInline(line)}
        </p>
      )
    }
  }

  flushList()
  return elements
}
