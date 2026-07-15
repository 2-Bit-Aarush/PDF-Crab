import fs from 'fs'
import path from 'path'

const TELEMETRY_FILE = path.join(process.cwd(), '.telemetry.json')

export function recordTelemetry(category: string, durationMs: number, meta: any = {}) {
  if (process.env.NODE_ENV !== 'development') return

  try {
    let list: any[] = []
    if (fs.existsSync(TELEMETRY_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'))
      } catch {
        list = []
      }
    }
    list.push({
      timestamp: new Date().toISOString(),
      category,
      durationMs,
      meta,
    })
    // Limit history length to latest 100 items
    if (list.length > 100) {
      list = list.slice(list.length - 100)
    }
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(list, null, 2))
  } catch (err) {
    console.error('Telemetry logging exception:', err)
  }
}

export function getTelemetry() {
  if (process.env.NODE_ENV !== 'development') return []
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      return JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'))
    }
  } catch {}
  return []
}
