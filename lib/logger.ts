type LogMetadata = {
  requestId?: string
  userId?: string
  vaultId?: string
  jobId?: string
  duration?: number
  [key: string]: any
}

export const logger = {
  info(message: string, meta: LogMetadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...meta,
    }
    console.log(JSON.stringify(entry))
  },
  warn(message: string, meta: LogMetadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...meta,
    }
    console.log(JSON.stringify(entry))
  },
  error(message: string, error?: any, meta: LogMetadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error?.message || error || null,
      ...meta,
    }
    console.error(JSON.stringify(entry))
  },
}
