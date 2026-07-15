'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Folder, Search, Plus, User, Sliders } from 'lucide-react'
import { useVaults } from '@/lib/vault-store'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const { createVault, createMasterNote, vaults } = useVaults()

  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState<'vault' | 'note' | null>(null)
  
  const [vaultName, setVaultName] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [selectedVaultId, setSelectedVaultId] = useState('')

  const activeVaultId = params?.id as string // if on a vault page

  const navItems = [
    { label: 'Vaults', href: '/dashboard', icon: Folder },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Create', href: '#create', icon: Plus, isAction: true },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Sliders },
  ]

  function handleCreateClick(e: React.MouseEvent) {
    e.preventDefault()
    setCreateOpen(true)
  }

  function handleCreateVault(e: React.FormEvent) {
    e.preventDefault()
    const name = vaultName.trim()
    if (!name) return
    const id = createVault(name)
    setVaultName('')
    setCreateType(null)
    setCreateOpen(false)
    router.push(`/vault/${id}`)
  }

  function handleCreateNote(e: React.FormEvent) {
    e.preventDefault()
    const title = noteTitle.trim()
    const targetVaultId = activeVaultId || selectedVaultId || (vaults.length > 0 ? vaults[0].id : '')
    if (!title || !targetVaultId) return
    const id = createMasterNote(targetVaultId, title)
    setNoteTitle('')
    setSelectedVaultId('')
    setCreateType(null)
    setCreateOpen(false)
    router.push(`/master/${id}`)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t border-border bg-card/90 pb-safe backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center justify-around px-2">
          {navItems.map((item) => {
            const active = !item.isAction && (pathname === item.href || pathname.startsWith(item.href + '/'))
            
            if (item.isAction) {
              return (
                <button
                  key={item.href}
                  onClick={handleCreateClick}
                  className="flex flex-col items-center justify-center py-1 text-muted-foreground transition-colors hover:text-foreground touch-highlight-active rounded-lg"
                  style={{ width: '64px', height: '48px' }}
                  aria-label="Create new workspace item"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm active:opacity-90">
                    <Plus className="size-[20px]" strokeWidth={2.2} />
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-1 text-xs font-medium transition-colors touch-highlight-active rounded-lg',
                  active ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                )}
                style={{ width: '64px', height: '48px' }}
              >
                <item.icon className="size-[20px]" strokeWidth={1.75} />
                <span className="mt-0.5 text-[10px] tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Quick Create Dialog */}
      <Modal open={createOpen && !createType} onClose={() => setCreateOpen(false)} title="Create New">
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            variant="secondary"
            className="w-full h-12 rounded-lg text-left justify-start px-4 font-medium"
            onClick={() => setCreateType('vault')}
          >
            New Vault
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full h-12 rounded-lg text-left justify-start px-4 font-medium"
            onClick={() => {
              setCreateType('note')
              if (!activeVaultId && vaults.length > 0) {
                setSelectedVaultId(vaults[0].id)
              }
            }}
            disabled={vaults.length === 0 && !activeVaultId}
          >
            New Master Note
          </Button>
          <Button
            variant="ghost"
            className="w-full h-10 mt-2 text-muted-foreground"
            onClick={() => setCreateOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Create Vault Sub-dialog */}
      <Modal open={createOpen && createType === 'vault'} onClose={() => { setCreateOpen(false); setCreateType(null); }} title="Create Vault">
        <form onSubmit={handleCreateVault} className="flex flex-col gap-4">
          <input
            autoFocus
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            placeholder="Vault name"
            className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-lg px-4"
              onClick={() => { setCreateType(null); setVaultName(''); }}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4"
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Note Sub-dialog */}
      <Modal open={createOpen && createType === 'note'} onClose={() => { setCreateOpen(false); setCreateType(null); }} title="Create Master Note">
        <form onSubmit={handleCreateNote} className="flex flex-col gap-4">
          <input
            autoFocus
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title"
            className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          
          {/* Show Vault Selector if NOT on a Vault Page */}
          {!activeVaultId && vaults.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vault-select" className="text-xs font-medium text-muted-foreground">Select Vault</label>
              <select
                id="vault-select"
                value={selectedVaultId}
                onChange={(e) => setSelectedVaultId(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground outline-none focus:border-ring"
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-lg px-4"
              onClick={() => { setCreateType(null); setNoteTitle(''); }}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4"
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
