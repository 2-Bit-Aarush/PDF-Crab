'use client'

import { useState, useEffect } from 'react'
import { useVaults } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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
      <div className="page-shell text-center">
        <p className="text-sm text-muted-foreground">Reading archive records...</p>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account in the archive.</p>
      </header>

      <div className="mt-6 flex items-center gap-4 py-1">
        <span className="flex size-14 items-center justify-center rounded-[3px] bg-secondary text-base font-sans font-semibold text-foreground">
          {name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <div>
          <p className="text-[15px] font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { value: vaults.length, label: 'Vaults' },
          { value: totalNotes, label: 'Notes' },
          { value: totalSources, label: 'Sources' },
        ].map((stat) => (
          <div key={stat.label} className="py-3 text-center">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-brand uppercase text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <hr className="pixel-divider mt-6" />

      <form onSubmit={handleSave} className="mt-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <input
              id="name"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              className="field-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
            />
          </div>

          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="min-w-[5rem]">
              {saved && <span className="text-xs font-medium text-accent">Archive updated</span>}
            </div>
            <Button type="submit" size="lg">
              Save
            </Button>
          </div>
        </div>
      </form>

      <hr className="pixel-divider mt-6" />

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Telegram Integration
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Link your archive to the Telegram Bot to upload files and query vaults on the go.
          </p>
        </div>

        {profile?.telegram_chat_id ? (
          <div className="rounded-[3px] border border-accent/20 bg-accent/5 p-4 text-sm text-foreground">
            ✓ Connected to Telegram account{' '}
            <b>{profile.telegram_username ? `@${profile.telegram_username}` : 'linked'}</b>
          </div>
        ) : (
          <div className="rounded-[3px] border border-border p-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              1. Open Telegram and search for <b>@pdf_crab_bot</b>.
              <br />
              2. Send the following command to link your account:
            </p>
            <div className="flex items-center justify-between bg-secondary/40 px-3 py-2 text-xs font-mono text-accent rounded-[3px]">
              <span>/start {profile?.telegram_link_code || 'loading...'}</span>
              <button
                type="button"
                onClick={() => {
                  if (profile?.telegram_link_code) {
                    navigator.clipboard.writeText(`/start ${profile.telegram_link_code}`)
                    alert('Command copied to clipboard!')
                  }
                }}
                className="text-[10px] uppercase text-muted-foreground hover:text-foreground font-sans font-medium"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
