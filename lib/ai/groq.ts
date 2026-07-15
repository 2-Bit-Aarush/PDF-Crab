import { Groq } from 'groq-sdk'
import { AIProvider } from './provider'

export class GroqAIProvider implements AIProvider {
  private client: Groq

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    })
  }

  async complete(
    prompt: string,
    systemPrompt?: string
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    let retries = 2
    let delay = 1000

    while (retries >= 0) {
      try {
        const startTime = Date.now()
        const response = await this.client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
            { role: 'user' as const, content: prompt },
          ],
          temperature: 0.1,
        })
        const duration = Date.now() - startTime
        try {
          const { recordTelemetry } = require('@/lib/dev-logger')
          recordTelemetry('groq', duration, { model: 'llama-3.3-70b-versatile' })
        } catch {}

        const text = response.choices[0]?.message?.content || ''
        const inputTokens = response.usage?.prompt_tokens || 0
        const outputTokens = response.usage?.completion_tokens || 0

        return { text, inputTokens, outputTokens }
      } catch (err: any) {
        if (retries === 0) {
          throw new Error(`Groq API error: ${err.message || err}`)
        }
        retries--
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2
      }
    }
    throw new Error('Groq retry exhaustion')
  }
}
