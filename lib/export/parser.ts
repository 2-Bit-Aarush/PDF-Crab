export interface CompiledSectionBlock {
  heading: string
  definition?: string
  keyPoints?: { text: string; source: string }[]
  explanation?: string
  trendsAndTables?: string
  examples?: { text: string; source: string }[]
  notesAndExceptions?: string
  sourceEvidence?: { caption: string; url: string; source: string }[]
  metadata?: any
}

export function parseNotebookSection(section: { heading: string; body: string; metadata?: any }): CompiledSectionBlock {
  const lines = section.body.split('\n')
  let currentBlockType: 'none' | 'definition' | 'points' | 'explanation' | 'trends' | 'examples' | 'notes' | 'evidence' = 'none'

  let definition = ''
  let explanation = ''
  let trendsAndTables = ''
  let notesAndExceptions = ''
  const keyPoints: { text: string; source: string }[] = []
  const examples: { text: string; source: string }[] = []
  const sourceEvidence: { caption: string; url: string; source: string }[] = []

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim()
    if (!line) continue

    const lowerLine = line.toLowerCase()
    if (lowerLine.startsWith('**definition**:')) {
      currentBlockType = 'definition'
      continue
    } else if (lowerLine.startsWith('**important points**:') || lowerLine.startsWith('**key points**:')) {
      currentBlockType = 'points'
      continue
    } else if (lowerLine.startsWith('**key explanation**:') || lowerLine.startsWith('**explanation**:') || lowerLine.startsWith('**detailed explanation**:')) {
      currentBlockType = 'explanation'
      continue
    } else if (lowerLine.startsWith('**important trends / tables**:') || lowerLine.startsWith('**trends and tables**:') || lowerLine.startsWith('**tables**:')) {
      currentBlockType = 'trends'
      continue
    } else if (lowerLine.startsWith('**example**:') || lowerLine.startsWith('**examples**:')) {
      currentBlockType = 'examples'
      continue
    } else if (lowerLine.startsWith('**notes / exceptions**:') || lowerLine.startsWith('**notes and exceptions**:') || lowerLine.startsWith('**notes**:') || lowerLine.startsWith('**exceptions**:')) {
      currentBlockType = 'notes'
      continue
    } else if (lowerLine.startsWith('**original source evidence**:') || lowerLine.startsWith('**source evidence**:') || lowerLine.startsWith('**visual snippet**:')) {
      currentBlockType = 'evidence'
      continue
    }

    if (currentBlockType === 'definition') {
      if (line.startsWith('>')) {
        definition += (definition ? '\n' : '') + line.substring(1).trim()
      } else {
        definition += (definition ? '\n' : '') + line
      }
    } else if (currentBlockType === 'explanation') {
      explanation += (explanation ? '\n' : '') + line
    } else if (currentBlockType === 'trends') {
      trendsAndTables += (trendsAndTables ? '\n' : '') + line
    } else if (currentBlockType === 'notes') {
      notesAndExceptions += (notesAndExceptions ? '\n' : '') + line
    } else if (currentBlockType === 'evidence') {
      if (line.startsWith('![')) {
        const match = line.match(/!\[(.*?)\]\((.*?)\)/)
        if (match) {
          const caption = match[1]
          const url = match[2]
          let source = ''
          if (idx + 1 < lines.length && lines[idx + 1].trim().startsWith('*Source:')) {
            source = lines[idx + 1].replace(/\*Source:|\*/g, '').trim()
            idx++
          }
          sourceEvidence.push({ caption, url, source })
        }
      }
    } else if (currentBlockType === 'examples') {
      if (line.startsWith('>')) {
        const text = line.substring(1).trim()
        let source = ''
        if (idx + 1 < lines.length && lines[idx + 1].trim().startsWith('*Source:')) {
          source = lines[idx + 1].replace(/\*Source:|\*/g, '').trim()
          idx++
        }
        examples.push({ text, source })
      }
    } else if (currentBlockType === 'points') {
      if (line.startsWith('-')) {
        const textRaw = line.substring(1).trim()
        const srcMatch = textRaw.match(/(.*)\((Source:.*?)\)/)
        if (srcMatch) {
          keyPoints.push({ text: srcMatch[1].trim(), source: srcMatch[2].replace('Source:', '').trim() })
        } else {
          keyPoints.push({ text: textRaw, source: '' })
        }
      }
    }
  }

  // Fallback to metadata visualAssets if sourceEvidence is empty
  if (sourceEvidence.length === 0 && section.metadata?.visualAssets) {
    for (const v of section.metadata.visualAssets) {
      if (v.imageUrl) {
        sourceEvidence.push({
          caption: v.subType || 'Source Image',
          url: v.imageUrl,
          source: v.source || '',
        })
      }
    }
  }

  return {
    heading: section.heading,
    definition: definition.trim(),
    keyPoints,
    explanation: explanation.trim(),
    trendsAndTables: trendsAndTables.trim(),
    examples,
    notesAndExceptions: notesAndExceptions.trim(),
    sourceEvidence,
    metadata: section.metadata,
  }
}
