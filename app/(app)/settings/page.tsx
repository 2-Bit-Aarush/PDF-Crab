'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PixelCrabIcon, PixelFolderIcon, PixelDocIcon } from '@/components/pixel-icons'
import { Reveal } from '@/components/reveal'
import { EmptyArchive } from '@/components/empty-archive'
import { Lock, Terminal, FileText, Sparkles } from 'lucide-react'

const exportOptions = [
  { value: 'markdown', label: 'Markdown', desc: 'Plain text with markdown', icon: FileText },
  { value: 'pdf', label: 'PDF', desc: 'Formatted document', icon: PixelDocIcon },
  { value: 'plain', label: 'Plain text', desc: 'Raw text without formatting', icon: PixelDocIcon },
] as const

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [autoCompile, setAutoCompile] = useState(true)
  const [preserveFormatting, setPreserveFormatting] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)
  const [exportFormat, setExportFormat] = useState('markdown')

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="page-shell">
      
      <header className="flex flex-col gap-0.5 mb-2">
        <Reveal>
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">How your archive behaves.</p>
        </Reveal>
      </header>

<Reveal delay={60}>
        <div className="mt-6 card-base card-hover p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Sparkles className="size-3.5 text-accent" />
            Appearance
          </h2>
          <section className="space-y-0">
            {[
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
            ].map((row, i) => (
              <div key={row.title} className="border-t border-border/50 first:border-t-0">
                <label
                  onClick={() => row.onChange(!row.checked)}
                  className="flex items-center justify-between gap-6 py-4 cursor-pointer touch-highlight-active min-h-[56px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{row.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{row.desc}</p>
                  </div>
                  <Toggle checked={row.checked} label={row.title} onChange={row.onChange} />
                </label>
              </div>
            ))}
          </section>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-4 card-base card-hover p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <FileText className="size-3.5 text-accent" />
            Default export format
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">Used when exporting a master note.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {exportOptions.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                onClick={() => setExportFormat(fmt.value)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 min-h-[88px] rounded-[10px] border text-xs font-semibold transition-all duration-200 touch-highlight-active text-center p-3',
                  exportFormat === fmt.value
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border/80'
                )}
              >
                <fmt.icon className="size-5 text-accent" />
                <div className="text-center">
                  <div className="font-medium text-foreground">{fmt.label}</div>
                  <div className="text-[10px] text-muted-foreground">{fmt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={180}>
        <hr className="pixel-divider my-4" />
      </Reveal>

      <section className="mt-4">
        <Reveal delay={240}>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Terminal className="size-3.5 text-accent" />
            Session
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">Leave the archive on this device.</p>
        </Reveal>
        <Reveal delay={300}>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </Reveal>
      </section>

      <Reveal delay={360}>
        <div className="mt-10 pt-6 border-t border-border/30 text-center">
          <PixelCrabIcon state="default" className="size-8 text-accent/50 mx-auto mb-2" />
          <p className="font-brand text-[10px] uppercase tracking-widest text-muted-foreground/60">
            PDF-Crab v0.1.0 · Knowledge Compiler
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/40">
            Built for students who refuse to lose information.
          </p>
        </div>
      </Reveal>
    </div>
  )
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-[6px] border transition-all duration-200',
        checked ? 'bg-accent/20 border-accent/50' : 'bg-secondary border-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-[4px] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          checked ? 'translate-x-5 bg-accent' : 'bg-muted-foreground/50',
        )}
      />
    </button>
  )
}