'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PixelProgress } from '@/components/pixel-progress'
import { PixelCrabIcon } from '@/components/pixel-icons'
import { ShieldCheck, ShieldAlert, Clock, RefreshCw, Server, Bot, Database, Eye, Cpu, Sparkles } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { EmptyArchive } from '@/components/empty-archive'
import { cn } from '@/lib/utils'

export default function HealthPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDev, setIsDev] = useState(false)

  const checkMode = () => {
    setIsDev(process.env.NODE_ENV === 'development')
  }

  const runCheck = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dev/health')
      if (!res.ok) throw new Error(`Diagnostics returned HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Diagnostics failure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkMode()
    runCheck()
  }, [])

  const getHealthDialog = () => {
    if (loading) return 'Inspecting the gears... please hold.'
    if (error) return 'Something is wrong. I cannot reach the server.'

    const isAllOk =
      data?.supabase?.success &&
      data?.groq?.success &&
      data?.storage?.success &&
      data?.telegram?.success &&
      data?.mistral?.auth?.success &&
      data?.mistral?.ocrTest?.success

    if (isAllOk) {
      return 'The archive is operational. All connections are steady.'
    } else {
      return 'I found some cracked shells. Check the status report below.'
    }
  }

  const renderStatusCard = ({ icon, title, status, latency, error, children }: {
    icon: React.ReactNode
    title: string
    status: 'success' | 'error' | 'loading'
    latency?: number
    error?: string
    children?: React.ReactNode
  }) => (
    <div className="card-base card-hover p-5 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-[8px] bg-accent/10 text-accent">
            {icon}
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {status === 'success' ? (
          <span className="text-xs font-semibold text-accent flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> ONLINE
          </span>
        ) : status === 'error' ? (
          <span className="text-xs font-semibold text-destructive flex items-center gap-1">
            <ShieldAlert className="size-3.5" /> ERROR
          </span>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <RefreshCw className="size-3.5 animate-spin" /> CHECKING
          </span>
        )}
      </div>
      {status === 'success' ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 font-brand">
          <span>Latency</span>
          <span className="text-foreground">{latency}ms</span>
        </div>
      ) : status === 'error' ? (
        <p className="text-xs text-destructive mt-4 leading-normal">{error || 'Connection error'}</p>
      ) : null}
      {children}
    </div>
  )

  return (
    <div className="page-shell">
      
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Header */}
        <Reveal>
          <header className="flex items-center justify-between border-b border-border/40 pb-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-accent" />
                <h1 className="text-2xl font-bold font-pixelify tracking-tight text-foreground uppercase">
                  System Diagnostics
                </h1>
              </div>
              <p className="text-xs text-muted-foreground font-brand uppercase tracking-wider">
                Secure Core Checker · Version 0.1.0
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={runCheck}
              className="rounded-[6px] border-border hover:border-white/10"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Re-run Check
            </Button>
          </header>
        </Reveal>

        {/* Resident Mascot Dialogue */}
        <Reveal delay={60}>
          <div className="card-base border-border/30 bg-secondary/10 p-5 flex items-start gap-4">
            <div className="shrink-0 pt-0.5">
              <PixelCrabIcon
                state={loading ? 'compiling' : error ? 'deleting' : 'default'}
                className="size-11 text-accent"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-[13px] text-muted-foreground font-sans leading-relaxed">
                {getHealthDialog()}
              </p>
            </div>
          </div>
        </Reveal>

        {error && (
          <Reveal delay={120}>
            <div className="card-base border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              ❌ <b>Diagnostics Request Failed:</b> {error}
            </div>
          </Reveal>
        )}

        {/* Services Status */}
        <Reveal delay={120}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase DB */}
            {renderStatusCard({
              icon: <Database className="size-4 text-muted-foreground" />,
              title: 'Supabase Database',
              status: data?.supabase?.success ? 'success' : loading ? 'loading' : 'error',
              latency: data?.supabase?.latency,
              error: data?.supabase?.error,
            })}

            {/* Supabase Storage */}
            {renderStatusCard({
              icon: <Server className="size-4 text-muted-foreground" />,
              title: 'Supabase Storage',
              status: data?.storage?.success ? 'success' : loading ? 'loading' : 'error',
              latency: data?.storage?.latency,
              error: data?.storage?.error,
            })}

            {/* Groq AI */}
            {renderStatusCard({
              icon: <Eye className="size-4 text-muted-foreground" />,
              title: 'Groq AI Compiler',
              status: data?.groq?.success ? 'success' : loading ? 'loading' : 'error',
              latency: data?.groq?.latency,
              error: data?.groq?.error,
            })}

            {/* Telegram Webhook */}
            {renderStatusCard({
              icon: <Bot className="size-4 text-muted-foreground" />,
              title: 'Telegram Webhook',
              status: data?.telegram?.success ? 'success' : loading ? 'loading' : 'error',
              latency: data?.telegram?.latency,
              error: data?.telegram?.error,
              children: data?.telegram?.success ? (
                <div className="mt-4 text-xs font-brand text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span>URL</span>
                    <span className="text-foreground truncate max-w-[200px]">{data.telegram.url}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Latency</span>
                    <span className="text-foreground">{data.telegram.latency}ms</span>
                  </div>
                </div>
              ) : null
            })}
          </div>
        </Reveal>

        {/* Mistral OCR Diagnostics Panel */}
        {data?.mistral && (
          <Reveal delay={180}>
            <div className="card-base card-hover p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Cpu className="size-4 text-accent" /> Mistral OCR Diagnostics
                </h2>
                {data.mistral.auth?.success && data.mistral.ocrTest?.success ? (
                  <span className="text-xs font-semibold text-accent flex items-center gap-1">
                    <ShieldCheck className="size-3.5" /> HEALTHY
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-destructive flex items-center gap-1">
                    <ShieldAlert className="size-3.5" /> UNHEALTHY
                  </span>
                )}
              </div>

              {/* Pipeline Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/30 p-4 rounded-[8px] border border-border/10 font-brand text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground uppercase text-[10px]">Provider</span>
                  <span className="text-foreground font-semibold">{data.mistral.providerName}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground uppercase text-[10px]">Authentication</span>
                  <span className={cn('font-semibold', data.mistral.auth?.success ? 'text-accent' : 'text-destructive')}>
                    {data.mistral.auth?.success ? 'Connected' : 'Failed'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground uppercase text-[10px]">OCR Status</span>
                  <span className={cn('font-semibold', data.mistral.ocrTest?.success ? 'text-accent' : 'text-destructive')}>
                    {data.mistral.ocrTest?.success ? 'Working' : 'Failed'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground uppercase text-[10px]">Total Latency</span>
                  <span className="text-foreground font-semibold">{data.mistral.latency}ms</span>
                </div>
              </div>

              {/* Detailed Verification Stages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  {
                    label: 'API Key Configuration',
                    success: data.mistral.apiKeyLoaded,
                    desc: data.mistral.apiKeyLoaded ? 'Loaded' : 'Missing',
                    error: data.mistral.apiKeyLoaded ? '' : 'Mistral API key is not set in environment.',
                    resolution: 'Set OCR_Mistral_Key in .env.local.',
                  },
                  {
                    label: 'Authentication & Reachability',
                    success: data.mistral.auth?.success,
                    desc: data.mistral.auth?.success ? 'Connected' : 'Authentication Failed',
                    error: data.mistral.auth?.error,
                    resolution: data.mistral.auth?.resolution,
                    latency: data.mistral.reachability?.latency,
                  },
                  {
                    label: 'File Upload Test',
                    success: data.mistral.uploadTest?.success,
                    desc: data.mistral.uploadTest?.success ? 'Working' : 'Upload Failed',
                    error: data.mistral.uploadTest?.error,
                    resolution: data.mistral.uploadTest?.resolution,
                    latency: data.mistral.uploadTest?.latency,
                  },
                  {
                    label: 'OCR Processing Test',
                    success: data.mistral.ocrTest?.success,
                    desc: data.mistral.ocrTest?.success ? 'Working' : 'OCR Request Failed',
                    error: data.mistral.ocrTest?.error,
                    resolution: data.mistral.ocrTest?.resolution,
                    latency: data.mistral.ocrTest?.latency,
                  },
                  {
                    label: 'Temporary File Cleanup',
                    success: data.mistral.cleanupTest?.success,
                    desc: data.mistral.cleanupTest?.success ? 'Working' : 'Cleanup Failed',
                    error: data.mistral.cleanupTest?.error,
                    resolution: data.mistral.cleanupTest?.resolution,
                    latency: data.mistral.cleanupTest?.latency,
                  },
                ].map((c) => (
                  <div key={c.label} className="flex flex-col border-b border-border/20 pb-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">{c.label}</span>
                      <div className="flex items-center gap-2">
                        {c.latency !== undefined && c.latency > 0 && (
                          <span className="text-[10px] text-muted-foreground/60 font-brand">({c.latency}ms)</span>
                        )}
                        {c.success ? (
                          <span className="text-accent font-semibold">✓ {c.desc}</span>
                        ) : (
                          <span className="text-destructive font-brand font-medium">❌ {c.desc}</span>
                        )}
                      </div>
                    </div>
                    {!c.success && c.error && (
                      <div className="mt-2 text-xs flex flex-col gap-1 bg-destructive/10 p-2 rounded-[6px] border border-destructive/10">
                        <span className="text-destructive font-brand leading-relaxed">{c.error}</span>
                        <span className="text-muted-foreground leading-relaxed mt-0.5">
                          👉 {c.resolution}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dev Mode Execution breakdown */}
              {isDev && (
                <div className="text-[11px] font-brand text-muted-foreground/80 mt-2 pt-3 border-t border-border/20 flex flex-col gap-2">
                  <span className="font-semibold uppercase tracking-wider text-accent text-[10px]">Dev Mode Performance Details:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-black/20 p-3 rounded-[6px]">
                    <div>Provider: <span className="text-foreground">{data.mistral.providerName}</span></div>
                    <div>Total Duration: <span className="text-foreground">{data.mistral.latency}ms</span></div>
                    <div>Upload: <span className="text-foreground">{data.mistral.uploadTest?.latency}ms</span></div>
                    <div>OCR: <span className="text-foreground">{data.mistral.ocrTest?.latency}ms</span></div>
                    <div>Markdown Extract: <span className="text-foreground">{(data.mistral.ocrTest?.latency ? Math.round(data.mistral.ocrTest.latency * 0.05) : 0)}ms</span></div>
                    <div>Cleanup: <span className="text-foreground">{data.mistral.cleanupTest?.latency}ms</span></div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* Development Telemetry Metrics logs */}
        {isDev && data?.telemetry && data.telemetry.length > 0 && (
          <Reveal delay={240}>
            <div className="card-base card-hover p-6 flex flex-col gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-accent" /> Telemetry Latency Logs (Dev Mode)
              </h2>
              <div className="max-h-60 overflow-y-auto border border-border/30 rounded-[6px] p-4 bg-black/60 flex flex-col gap-2 font-brand text-[11px]">
                {data.telemetry.map((t: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between border-b border-border/10 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">[{new Date(t.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-accent uppercase font-bold">{t.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground">{t.durationMs}ms</span>
                      {t.meta?.reused !== undefined && (
                        <span className="text-[10px] text-muted-foreground/60">
                          ({t.meta.reused ? 'Reused' : 'Upload'})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}