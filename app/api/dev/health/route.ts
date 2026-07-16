import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GroqAIProvider } from '@/lib/ai/groq'
import { getTelemetry } from '@/lib/dev-logger'

async function checkMistralOCR() {
  const status = {
    providerName: 'Mistral OCR',
    apiKeyLoaded: false,
    auth: { success: false, error: '', resolution: '' },
    reachability: { success: false, error: '', latency: 0, resolution: '' },
    uploadTest: { success: false, error: '', latency: 0, resolution: '' },
    ocrTest: { success: false, error: '', latency: 0, pages: 0, markdownLength: 0, resolution: '' },
    cleanupTest: { success: false, error: '', latency: 0, resolution: '' },
    latency: 0,
  }

  const apiKey = process.env.OCR_Mistral_Key
  if (!apiKey) {
    status.auth.error = 'OCR_Mistral_Key is missing from environment.'
    status.auth.resolution = 'Add OCR_Mistral_Key to your local .env.local file.'
    return status
  }
  status.apiKeyLoaded = true

  const overallStart = Date.now()

  // 1. Connectivity & Reachability & Authentication Check (GET v1/models)
  const reachStart = Date.now()
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    })

    status.reachability.latency = Date.now() - reachStart

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        status.auth.error = `Authentication Failed (HTTP ${res.status}): Invalid API Key.`
        status.auth.resolution = 'Verify that your OCR_Mistral_Key is correct and active on the Mistral dashboard.'
      } else {
        status.auth.error = `HTTP ${res.status} returned from Models API.`
        status.auth.resolution = 'Verify Mistral platform services are operational.'
      }
      return status
    }

    status.reachability.success = true
    status.auth.success = true
  } catch (err: any) {
    status.reachability.error = `Network Error: ${err.message || err}`
    status.reachability.resolution = 'Check outbound connection and internet access to api.mistral.ai.'
    return status
  }

  // 2. File Upload Test
  let fileId = ''
  const uploadStart = Date.now()
  try {
    const miniPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/MediaBox [0 0 595 842]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 46\n>>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(PDF-Crab Health Check) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n307\n%%EOF'
    )
    const blob = new Blob([miniPdf], { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', blob, 'healthcheck.pdf')
    formData.append('purpose', 'ocr')

    const res = await fetch('https://api.mistral.ai/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(10000),
    })

    status.uploadTest.latency = Date.now() - uploadStart

    if (!res.ok) {
      status.uploadTest.error = `Upload failed (HTTP ${res.status}): ${await res.text()}`
      status.uploadTest.resolution = 'Verify Mistral Files API is operational and supports purpose="ocr".'
      return status
    }

    const data = await res.json()
    fileId = data.id
    if (!fileId) {
      status.uploadTest.error = 'API responded successfully but returned no file ID.'
      status.uploadTest.resolution = 'Inspect Mistral API response schema.'
      return status
    }
    status.uploadTest.success = true
  } catch (err: any) {
    status.uploadTest.error = `Upload Network/Timeout: ${err.message || err}`
    status.uploadTest.resolution = 'Verify network capacity and that file uploads are not blocked.'
    return status
  }

  // 3. OCR Processing Test
  const ocrStart = Date.now()
  try {
    const res = await fetch('https://api.mistral.ai/v1/ocr', {
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
      signal: AbortSignal.timeout(15000),
    })

    status.ocrTest.latency = Date.now() - ocrStart

    if (!res.ok) {
      status.ocrTest.error = `OCR Request Failed (HTTP ${res.status}): ${await res.text()}`
      status.ocrTest.resolution = 'Verify that mistral-ocr-latest model is active on your API quota.'
      await deleteFile(fileId, apiKey)
      return status
    }

    const data = await res.json()
    if (!data || !data.pages) {
      status.ocrTest.error = 'OCR response accepted but pages data is empty.'
      status.ocrTest.resolution = 'Inspect Mistral OCR raw payload structures.'
      await deleteFile(fileId, apiKey)
      return status
    }

    const text = data.pages.map((p: any) => p.markdown || '').join('\n')
    status.ocrTest.pages = data.pages.length
    status.ocrTest.markdownLength = text.length
    status.ocrTest.success = true
  } catch (err: any) {
    status.ocrTest.error = `OCR Processing Timeout/Error: ${err.message || err}`
    status.ocrTest.resolution = 'Check outbound connection latency or API load limits.'
    await deleteFile(fileId, apiKey)
    return status
  }

  // 4. Temporary File Deletion Clean up
  const deleteStart = Date.now()
  try {
    const deleted = await deleteFile(fileId, apiKey)
    status.cleanupTest.latency = Date.now() - deleteStart
    if (!deleted) {
      status.cleanupTest.error = 'File deletion failed (HTTP failure).'
      status.cleanupTest.resolution = 'Inspect Mistral Files DELETE API response logs.'
    } else {
      status.cleanupTest.success = true
    }
  } catch (err: any) {
    status.cleanupTest.error = `File Cleanup Error: ${err.message || err}`
    status.cleanupTest.resolution = 'Verify delete connection permissions.'
  }

  status.latency = Date.now() - overallStart
  return status
}

async function deleteFile(fileId: string, apiKey: string): Promise<boolean> {
  const res = await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  return res.ok
}

export async function GET() {
  try {
    const adminSupabase = createAdminClient()

    // 1. Supabase Check
    const startSupa = Date.now()
    let supabaseStatus = { success: false, latency: 0, error: '' }
    try {
      const { error } = await adminSupabase.from('profiles').select('id').limit(1)
      if (error) throw error
      supabaseStatus = { success: true, latency: Date.now() - startSupa, error: '' }
    } catch (err: any) {
      supabaseStatus = { success: false, latency: 0, error: err.message }
    }

    // 2. Groq Check
    const startGroq = Date.now()
    let groqStatus = { success: false, latency: 0, error: '' }
    try {
      const provider = new GroqAIProvider()
      await provider.complete('Hello', 'Test')
      groqStatus = { success: true, latency: Date.now() - startGroq, error: '' }
    } catch (err: any) {
      groqStatus = { success: false, latency: 0, error: err.message }
    }

    // 3. Storage Check
    const startStorage = Date.now()
    let storageStatus = { success: false, latency: 0, error: '' }
    try {
      const { error } = await adminSupabase.storage.listBuckets()
      if (error) throw error
      storageStatus = { success: true, latency: Date.now() - startStorage, error: '' }
    } catch (err: any) {
      storageStatus = { success: false, latency: 0, error: err.message }
    }

    // 4. Telegram Check
    const startTelegram = Date.now()
    let telegramStatus = { success: false, latency: 0, error: '', url: '' }
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Missing token')
      const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.description || 'Webhook check failed')
      telegramStatus = {
        success: true,
        latency: Date.now() - startTelegram,
        error: '',
        url: data.result?.url || 'not set',
      }
    } catch (err: any) {
      telegramStatus = { success: false, latency: 0, error: err.message, url: '' }
    }

    // 5. Mistral OCR Check
    const mistralStatus = await checkMistralOCR()

    return NextResponse.json({
      supabase: supabaseStatus,
      groq: groqStatus,
      storage: storageStatus,
      telegram: telegramStatus,
      mistral: mistralStatus,
      telemetry: getTelemetry(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
