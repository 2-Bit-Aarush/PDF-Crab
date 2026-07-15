import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'
import { GroqAIProvider } from '@/lib/ai/groq'
import { getGoogleAccessToken } from '@/lib/ocr/vision'
import { getTelemetry } from '@/lib/dev-logger'

async function checkGCPVision() {
  const status = {
    clientInit: { success: false, error: '', resolution: '' },
    credsLoaded: { success: false, error: '', resolution: '' },
    auth: { success: false, error: '', resolution: '' },
    apiEnabled: { success: false, error: '', resolution: '' },
    iamPermissions: { success: false, error: '', resolution: '' },
    quotaStatus: { success: false, error: '', resolution: '' },
    connectivity: { success: false, error: '', resolution: '' },
    latency: 0,
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!credPath) {
    status.clientInit.error = 'GOOGLE_APPLICATION_CREDENTIALS env variable is not set.'
    status.clientInit.resolution =
      'Define GOOGLE_APPLICATION_CREDENTIALS pointing to the service account JSON in .env.local.'
    return status
  }
  status.clientInit.success = true

  let creds: any = null
  try {
    creds = JSON.parse(fs.readFileSync(path.resolve(credPath), 'utf8'))
    status.credsLoaded.success = true
  } catch (err: any) {
    status.credsLoaded.error = `Failed to read or parse JSON file: ${err.message}`
    status.credsLoaded.resolution = 'Verify the credentials JSON format and filepath.'
    return status
  }

  let token = ''
  try {
    token = await getGoogleAccessToken()
    status.auth.success = true
  } catch (err: any) {
    status.auth.error = err.message
    status.auth.resolution =
      'Ensure the private_key and client_email in the JSON credentials are correct.'
    return status
  }

  const pixelPng =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  const requestBody = {
    requests: [
      {
        image: { content: pixelPng },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
      },
    ],
  }

  const start = Date.now()
  try {
    const res = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(5000),
    })

    status.connectivity.success = true
    status.latency = Date.now() - start

    const data = await res.json()

    if (!res.ok) {
      const code = res.status
      const message = data.error?.message || ''

      if (message.includes('API_KEY_SERVICE_BLOCKED') || message.includes('disabled')) {
        status.apiEnabled.error = `Vision API Disabled (HTTP ${code}): ${message}`
        status.apiEnabled.resolution =
          'Enable the Cloud Vision API in your Google Cloud Console project.'
      } else if (code === 403 || message.includes('PERMISSION_DENIED')) {
        status.iamPermissions.error = `Permission Denied (HTTP ${code}): ${message}`
        status.iamPermissions.resolution =
          'Add the Cloud Vision User role to the service account in GCP IAM.'
      } else if (code === 429 || message.includes('QUOTA_EXCEEDED')) {
        status.quotaStatus.error = `Quota Exceeded (HTTP ${code}): ${message}`
        status.quotaStatus.resolution = 'Check your API project quota and billing details.'
      } else {
        status.apiEnabled.error = `Vision API HTTP ${code}: ${message}`
        status.apiEnabled.resolution = 'Inspect Google Cloud console logs.'
      }
    } else {
      status.apiEnabled.success = true
      status.iamPermissions.success = true
      status.quotaStatus.success = true
    }
  } catch (err: any) {
    status.connectivity.error = `Connectivity Error: ${err.message || err}`
    status.connectivity.resolution = 'Check server outbound connections or proxies.'
  }

  return status
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

    // 5. Vision Check
    const visionStatus = await checkGCPVision()

    return NextResponse.json({
      supabase: supabaseStatus,
      groq: groqStatus,
      storage: storageStatus,
      telegram: telegramStatus,
      vision: visionStatus,
      telemetry: getTelemetry(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
