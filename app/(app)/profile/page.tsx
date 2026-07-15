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
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
            />
          </div>

          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="min-w-[5rem]">
              {saved && (
                <span className="text-xs font-medium text-accent">Archive updated</span>
              )}
            </div>
            <Button type="submit" size="lg">
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
