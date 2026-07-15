'use client'

import { useState } from 'react'
import { useVaults } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const { vaults } = useVaults()
  const [name, setName] = useState('Alex Morgan')
  const [email, setEmail] = useState('alex@example.com')
  const [saved, setSaved] = useState(false)

  const totalNotes = vaults.reduce((sum, v) => sum + v.masterNotes.length, 0)
  const totalSources = vaults.reduce(
    (sum, v) => sum + v.masterNotes.reduce((s, n) => s + n.sources.length, 0),
    0,
  )

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-xs text-muted-foreground">Manage your account details.</p>
      </header>

      {/* Account Badge Header */}
      <div className="mt-6 flex items-center gap-4 py-2">
        <span className="flex size-14 items-center justify-center rounded-full border border-border bg-secondary text-base font-semibold text-foreground">
          {name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="text-[15px] font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{vaults.length}</p>
          <p className="mt-0.5 text-[10px] uppercase font-semibold text-muted-foreground">Vaults</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{totalNotes}</p>
          <p className="mt-0.5 text-[10px] uppercase font-semibold text-muted-foreground">Notes</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{totalSources}</p>
          <p className="mt-0.5 text-[10px] uppercase font-semibold text-muted-foreground">Sources</p>
        </div>
      </div>

      <hr className="pixel-divider mt-6" />

      {/* Form Settings */}
      <form onSubmit={handleSave} className="mt-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-lg border border-input bg-secondary px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border border-input bg-secondary px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="w-16">
              {saved && (
                <span className="text-xs font-semibold text-accent animate-pulse">
                  Saved
                </span>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-11 px-6 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
