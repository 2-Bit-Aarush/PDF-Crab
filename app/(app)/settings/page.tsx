'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Toggle({
  checked,
  label,
}: {
  checked: boolean
  label: string
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-secondary border border-border/40'
      }`}
    >
      <span
        className={`absolute top-[1px] left-[1px] size-5 rounded-full bg-foreground transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [preserveFormatting, setPreserveFormatting] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)
  const [exportFormat, setExportFormat] = useState('Markdown')

  const rows = [
    {
      title: 'Auto-generate on upload',
      desc: 'Rebuild the master note automatically when new sources are added.',
      checked: autoGenerate,
      onChange: setAutoGenerate,
    },
    {
      title: 'Preserve formatting',
      desc: 'Keep diagrams, formulas and original wording intact when merging.',
      checked: preserveFormatting,
      onChange: setPreserveFormatting,
    },
    {
      title: 'Weekly email digest',
      desc: 'Receive a summary of vault activity every week.',
      checked: emailDigest,
      onChange: setEmailDigest,
    },
  ]

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">Configure how PDF-Crab works for you.</p>
      </header>

      {/* Preferences Section */}
      <section className="mt-6 flex flex-col">
        {rows.map((row, i) => (
          <div key={row.title}>
            {i > 0 && <hr className="pixel-divider" />}
            <div
              onClick={() => row.onChange(!row.checked)}
              className="flex items-center justify-between gap-6 py-4 cursor-pointer touch-highlight-active rounded-lg"
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

      <hr className="pixel-divider mt-6" />

      {/* Default Export Section */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Default Export Format
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Used when exporting a master note.
        </p>
        <div className="mt-4 flex gap-2.5">
          {['Markdown', 'PDF', 'Plain text'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt)}
              className={cn(
                'flex-1 h-11 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-colors touch-highlight-active',
                exportFormat === fmt
                  ? 'border-accent/40 bg-accent/10 text-accent font-bold'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {fmt}
            </button>
          ))}
        </div>
      </section>

      <hr className="pixel-divider mt-8" />

      {/* Logout Section */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Sign out of PDF-Crab on this device.</p>
        <Button
          variant="destructive"
          size="lg"
          onClick={() => router.push('/login')}
          className="mt-4 w-full h-11 rounded-lg font-semibold touch-highlight-active"
        >
          Log out
        </Button>
      </section>
    </div>
  )
}
