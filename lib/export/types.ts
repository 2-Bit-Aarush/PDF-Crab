export interface NotebookViewModel {
  title: string
  sections: {
    heading: string
    body: string
    metadata?: {
      id?: string
      title?: string
      prerequisites?: string[]
      relatedTopics?: string[]
      difficulty?: string
      importanceScore?: number
      studyIntelligence?: {
        coverage: { score: number; documents: string[] }
        completeness: { percentage: number }
        importance: number
        confidence: number
        missingPrerequisites: string[]
        conflicts: string[]
      }
    }
  }[]
}

export interface OutputAdapter<T> {
  transform(model: NotebookViewModel): Promise<T>
}

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