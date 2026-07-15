export interface OCRProvider {
  extractText(pdfBuffer: Buffer): Promise<{
    text: string
    pages: number
    confidence: number
    rawData?: any
  }>
}
