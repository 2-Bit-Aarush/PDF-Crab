export interface AIProvider {
  complete(
    prompt: string,
    systemPrompt?: string
  ): Promise<{
    text: string
    inputTokens: number
    outputTokens: number
  }>
}
