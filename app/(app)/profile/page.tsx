'use client'

import { useState, useEffect } from 'react'
import { useVaults } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { PixelFolderIcon, PixelDocIcon, PixelMasterNoteIcon, PixelCrabIcon } from '@/components/pixel-icons'
import { Reveal } from '@/components/reveal'
import { cn } from '@/lib/utils'
import { EmptyArchive } from '@/components/empty-archive'
import { User, Lock, Terminal, Sparkles } from 'lucide-react'

export default function ProfilePage() {
  const { vaults } = useVaults()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const totalNotes = vaults.reduce((sum, v) => sum + v.masterNotes.length, 0)
  const totalSources = vaults.reduce(
    (sum, v) => sum + v.masterNotes.reduce((s, n) => s + n.sources.length, 0),
    0
  )

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (data) {
        setProfile(data)
        setName(data.full_name || '')
        setEmail(data.email || '')

        // Generate linking code if empty
        if (!data.telegram_link_code) {
          const code = 'crab-' + Math.random().toString(36).substring(2, 8).toUpperCase()
          await supabase.from('profiles').update({ telegram_link_code: code }).eq('id', user.id)
          data.telegram_link_code = code
        }

        // Check for URL redirect links
        const params = new URLSearchParams(window.location.search)
        const tgChatId = params.get('tg_chat_id')
        if (tgChatId) {
          await supabase.from('profiles').update({ telegram_chat_id: tgChatId }).eq('id', user.id)
          data.telegram_chat_id = tgChatId
          alert('Successfully connected to Telegram! You can now close this page and return to the Telegram bot.')
        }

        setProfile({ ...data })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, email: email })
      .eq('id', profile.id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <PixelCrabIcon state="default" className="size-12 text-accent animate-pulse-soft mb-4" />
          <p className="text-sm text-muted-foreground">Reading archive records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      
      <header className="flex flex-col gap-0.5">
        <Reveal>
          <div className="flex items-center gap-2 mb-2">
            <User className="size-5 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">Profile</h1>
          </div>
          <p className="text-sm text-muted-foreground">Your account in the archive.</p>
        </Reveal>
      </header>

      <Reveal delay={60}>
        <div className="mt-6 card-base card-hover p-5">
          <div className="flex items-center gap-4 py-1">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
              <User className="size-7" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">{name || 'Unnamed'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { value: vaults.length, label: 'Vaults', icon: PixelFolderIcon, color: 'accent' },
            { value: totalNotes, label: 'Notes', icon: PixelDocIcon, color: 'coral' },
            { value: totalSources, label: 'Sources', icon: PixelDocIcon, color: 'gold' },
          ].map((stat) => (
            <div key={stat.label} className="py-4 text-center card-base card-hover p-4">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <stat.icon className={`size-4 text-${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-[10px] font-brand uppercase text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={180}>
        <form onSubmit={handleSave} className="mt-6 card-base card-hover p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Sparkles className="size-3.5 text-accent" />
            Account Details
          </h2>
          <div className="flex flex-col gap-5">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              label="Name"
              placeholder="Your name"
              required
            />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
              placeholder="your@email.com"
              required
            />
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="min-w-[5rem]">
                {saved && (
                  <span className="text-xs font-medium text-accent flex items-center gap-1">
                    <Sparkles className="size-2.5" />
                    Archive updated
                  </span>
                )}
              </div>
              <Button type="submit" size="lg" disabled={loading}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Reveal>

      <Reveal delay={240}>
        <div className="mt-6 card-base card-hover p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <Lock className="size-3.5 text-accent" />
            Telegram Integration
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Link your archive to the Telegram Bot to upload files and query vaults on the go.
          </p>

          {profile?.telegram_chat_id ? (
            <div className="rounded-[8px] border border-accent/20 bg-accent/5 p-4 text-sm text-foreground">
              <div className="flex items-center gap-2 mb-2">
                <PixelCrabIcon state="default" className="size-4 text-accent" />
                <span className="font-medium text-foreground">Connected to Telegram</span>
              </div>
              <p className="text-muted-foreground">
                <b>{profile.telegram_username ? `@${profile.telegram_username}` : 'Linked account'}</b>
              </p>
            </div>
          ) : (
            <div className="rounded-[8px] border border-border bg-secondary/30 p-4 flex flex-col gap-3">
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  1. Open Telegram and search for <b>@pdf_crab_bot</b>.
                  <br />
                  2. Send the following command to link your account:
                </p>
              </div>
              <div className="flex items-center justify-between bg-secondary/40 px-3 py-2.5 text-xs font-mono text-accent rounded-[6px] border border-border/30">
                <span>/start {profile?.telegram_link_code || 'loading...'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (profile?.telegram_link_code) {
                      navigator.clipboard.writeText(`/start ${profile.telegram_link_code}`)
                      alert('Command copied to clipboard!')
                    }
                  }}
                  className="text-[10px] uppercase text-muted-foreground hover:text-foreground font-sans font-medium px-2 py-1 rounded-[4px] hover:bg-secondary transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={300}>
        <div className="mt-6 card-base card-hover p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <Terminal className="size-3.5 text-accent" />
            Archive Statistics
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {vaults.length > 0 ? vaults.map((v) => (
              <div key={v.id} className="rounded-[6px] border border-border bg-secondary/30 p-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <PixelFolderIcon className="size-4 text-accent" />
                  <span className="font-medium text-foreground truncate">{v.name}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground font-brand">
                  <span>{v.masterNotes.length} notes</span>
                  <span>{v.masterNotes.reduce((s, n) => s + n.sources.length, 0)} sources</span>
                </div>
              </div>
            )) : (
              <EmptyArchive
                icons={
                  <>
                    <PixelFolderIcon className="size-8" />
                    <PixelMasterNoteIcon className="size-8 text-accent/50" />
                  </>
                }
                title="No vaults yet"
                description="Create your first vault to start building your knowledge archive."
              />
            )}
          </div>
        </div>
      </Reveal>

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