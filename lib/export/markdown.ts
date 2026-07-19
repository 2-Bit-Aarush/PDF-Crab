import { NotebookViewModel, OutputAdapter } from './types'

export class MarkdownAdapter implements OutputAdapter<string> {
  async transform(model: NotebookViewModel): Promise<string> {
    let output = `# ${model.title}\n\n`
    for (const section of model.sections) {
      output += `## ${section.heading}\n\n${section.body}\n\n`
      if (section.metadata) {
        output += `### Study Metadata\n`
        const si = section.metadata.studyIntelligence
        if (si) {
          output += `- **Completeness**: ${si.completeness.percentage}%\n`
          output += `- **Confidence**: ${si.confidence}/10\n`
          if (si.missingPrerequisites.length > 0) {
            output += `- **Missing Prerequisites**: ${si.missingPrerequisites.join(', ')}\n`
          }
          if (si.conflicts.length > 0) {
            output += `- **Conflicts Detected**: ${si.conflicts.join('; ')}\n`
          }
        }
        output += `\n`
      }
      output += `---\n\n`
    }
    return output
  }
}