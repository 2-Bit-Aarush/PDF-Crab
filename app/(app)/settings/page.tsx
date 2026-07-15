'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Toggle({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-[3px] border transition-colors duration-200',
        checked ? 'bg-accent/20 border-accent/50' : 'bg-secondary border-border',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-[2px] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          checked ? 'translate-x-5 bg-accent' : 'bg-muted-foreground/50',
        )}
      />
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [autoCompile, setAutoCompile] = useState(true)
  const [preserveFormatting, setPreserveFormatting] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)
  const [exportFormat, setExportFormat] = useState('Markdown')

  const rows = [
    {
      title: 'Auto-compile on upload',
      desc: 'Rebuild the master note when new sources are attached.',
      checked: autoCompile,
      onChange: setAutoCompile,
    },
    {
      title: 'Preserve original wording',
      desc: 'Keep diagrams, formulas, and phrasing intact when merging.',
      checked: preserveFormatting,
      onChange: setPreserveFormatting,
    },
    {
      title: 'Weekly archive digest',
      desc: 'A short summary of vault activity, once a week.',
      checked: emailDigest,
      onChange: setEmailDigest,
    },
  ]

  return (
    <div className="page-shell">
      <header className="flex flex-col gap-0.5 mb-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">How your archive behaves.</p>
      </header>

      <section className="mt-6 flex flex-col">
        {rows.map((row, i) => (
          <div key={row.title}>
            {i > 0 && <hr className="pixel-divider" />}
            <div
              onClick={() => row.onChange(!row.checked)}
              className="flex items-center justify-between gap-6 py-4 cursor-pointer touch-highlight-active min-h-12"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{row.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{row.desc}</p>
              </div>
              <Toggle checked={row.checked} label={row.title} />
            </div>
          </div>
        ))}
      </section>

      <hr className="pixel-divider mt-4" />

      <section className="mt-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Default export format
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Used when exporting a master note.</p>
        <div className="mt-4 flex gap-2">
          {['Markdown', 'PDF', 'Plain text'].map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setExportFormat(fmt)}
              className={cn(
                'flex-1 min-h-12 rounded-[3px] border text-xs font-semibold transition-colors duration-200 touch-highlight-active',
                exportFormat === fmt
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {fmt}
            </button>
          ))}
        </div>
      </section>

      <hr className="pixel-divider mt-8" />

      <section className="mt-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Session
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Leave the archive on this device.</p>
        <Button
          variant="destructive"
          size="lg"
          onClick={() => router.push('/login')}
          className="mt-4 w-full"
        >
          Sign out
        </Button>
      </section>
    </div>
  )
}
