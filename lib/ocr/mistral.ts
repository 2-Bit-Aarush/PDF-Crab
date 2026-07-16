import { OCRProvider } from './provider'

export class MistralOCRProvider implements OCRProvider {
  async extractText(
    pdfBuffer: Buffer
  ): Promise<{ text: string; pages: number; confidence: number; rawData?: any }> {
    const apiKey = process.env.OCR_Mistral_Key
    if (!apiKey) {
      throw new Error('OCR_Mistral_Key environment variable is not configured')
    }

    // 1. Upload file to Mistral Files API via multipart/form-data
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', blob, 'document.pdf')
    formData.append('purpose', 'ocr')

    const uploadRes = await fetch('https://api.mistral.ai/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      throw new Error(`Mistral File Upload failed: ${errText}`)
    }

    const uploadData = await uploadRes.json()
    const fileId = uploadData.id

    // 2. Call the OCR API
    let retries = 3
    let delay = 1000
    let ocrData: any = null

    while (retries >= 0) {
      try {
        const ocrRes = await fetch('https://api.mistral.ai/v1/ocr', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-ocr-latest',
            document: {
              type: 'file',
              file_id: fileId,
            },
          }),
        })

        if (!ocrRes.ok) {
          const errText = await ocrRes.text()
          throw new Error(`Mistral OCR API failed: ${errText}`)
        }

        ocrData = await ocrRes.json()
        break
      } catch (err: any) {
        if (retries === 0) {
          throw err
        }
        retries--
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2
      }
    }

    if (!ocrData || !ocrData.pages) {
      throw new Error('Mistral OCR returned no pages')
    }

    // Join markdown from all pages
    const text = ocrData.pages.map((p: any) => p.markdown || '').join('\n')
    const pages = ocrData.pages.length
    const confidence = 0.99

    // 3. Delete the temporary file from Mistral Files API to clean up storage
    await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }).catch((err) => {
      console.error('[MistralOCRProvider] Failed to clean up file:', err)
    })

    return {
      text,
      pages,
      confidence,
      rawData: ocrData,
    }
  }
}
