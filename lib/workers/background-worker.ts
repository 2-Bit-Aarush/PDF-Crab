export async function triggerOCRJob(jobId: string, origin: string) {
  const targetUrl = `${origin}/api/worker/ocr`
  fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  }).catch((err) => {
    console.error('Error triggering background OCR:', err)
  })
}

export async function triggerCompileJob(jobId: string, origin: string) {
  const targetUrl = `${origin}/api/worker/compile`
  fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  }).catch((err) => {
    console.error('Error triggering background compile:', err)
  })
}
