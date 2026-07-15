import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { OCRProvider } from './provider'

function signJWT(payload: any, privateKey: string, clientEmail: string): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const tokenInput = `${encodedHeader}.${encodedPayload}`

  const sign = crypto.createSign('RSA-SHA256')
  sign.update(tokenInput)
  const signature = sign.sign(privateKey, 'base64url')

  return `${tokenInput}.${signature}`
}

export async function getGoogleAccessToken(): Promise<string> {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!credPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS not configured')
  }

  const absolutePath = path.resolve(credPath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Google credentials file not found at: ${absolutePath}`)
  }

  const creds = JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const jwt = signJWT(claim, creds.private_key, creds.client_email)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Google Auth exchange failed: ${errText}`)
  }

  const data = await res.json()
  return data.access_token
}

export class GoogleVisionOCRProvider implements OCRProvider {
  async extractText(
    pdfBuffer: Buffer
  ): Promise<{ text: string; pages: number; confidence: number; rawData?: any }> {
    let retries = 3
    let delay = 1000

    while (retries >= 0) {
      try {
        const token = await getGoogleAccessToken()

        // Base64 encode document
        const content = pdfBuffer.toString('base64')

        // We run a files:annotate call since it is synchronous and supports PDFs
        // If it's an image, we can run images:annotate
        const isPdf = pdfBuffer.slice(0, 4).toString() === '%PDF'

        const endpoint = isPdf
          ? 'https://vision.googleapis.com/v1/files:annotate'
          : 'https://vision.googleapis.com/v1/images:annotate'

        const requestBody = isPdf
          ? {
              requests: [
                {
                  inputConfig: {
                    content,
                    mimeType: 'application/pdf',
                  },
                  features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                  pages: [1, 2, 3, 4, 5], // Limit online compile to first 5 pages for stability
                },
              ],
            }
          : {
              requests: [
                {
                  image: { content },
                  features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                },
              ],
            }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error?.message || `Vision API HTTP ${res.status}`)
        }

        const responseData = await res.json()

        let text = ''
        let pagesCount = 1
        let confidenceSum = 0
        let confidenceCount = 0

        if (isPdf) {
          const responses = responseData.responses?.[0]?.responses || []
          pagesCount = responses.length
          for (const pageRes of responses) {
            text += (pageRes.fullTextAnnotation?.text || '') + '\n'
            const score = pageRes.fullTextAnnotation?.pages?.[0]?.confidence
            if (typeof score === 'number') {
              confidenceSum += score
              confidenceCount++
            }
          }
        } else {
          const fullText = responseData.responses?.[0]?.fullTextAnnotation
          text = fullText?.text || ''
          const score = fullText?.pages?.[0]?.confidence
          if (typeof score === 'number') {
            confidenceSum = score
            confidenceCount = 1
          }
        }

        const confidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 1.0

        return {
          text,
          pages: pagesCount,
          confidence,
          rawData: responseData,
        }
      } catch (err: any) {
        if (retries === 0) {
          throw new Error(`Google Cloud Vision API failed: ${err.message || err}`)
        }
        retries--
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2
      }
    }

    throw new Error('OCR retry boundary exceeded')
  }
}
