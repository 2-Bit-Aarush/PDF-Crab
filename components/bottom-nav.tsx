'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Folder, Search, Plus, User, Sliders } from 'lucide-react'
import { useVaults } from '@/lib/vault-store'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { PixelFolderIcon, PixelMasterNoteIcon } from '@/components/pixel-icons'

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

  const activeVaultId = params?.id as string

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
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[#08090c]/95 pb-safe">
        <div className="mx-auto flex w-full max-w-md items-center justify-around px-1">
          {navItems.map((item) => {
            const active =
              !item.isAction &&
              (pathname === item.href || pathname.startsWith(item.href + '/'))

            if (item.isAction) {
              return (
                <button
                  key={item.href}
                  onClick={handleCreateClick}
                  className="flex min-h-12 min-w-[64px] flex-col items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground touch-highlight-active"
                  aria-label="Create new item"
                >
                  <span className="flex size-10 items-center justify-center rounded-[3px] bg-accent text-accent-foreground">
                    <Plus className="size-5" strokeWidth={2.2} />
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-12 min-w-[64px] flex-col items-center justify-center py-1 text-[10px] font-medium transition-colors duration-200 touch-highlight-active',
                  active ? 'text-accent' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <item.icon className="size-5" strokeWidth={1.75} />
                <span className="mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <Modal open={createOpen && !createType} onClose={() => setCreateOpen(false)} title="Create">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setCreateType('vault')}
            className="flex min-h-12 w-full items-center gap-3 rounded-[3px] px-3 text-left touch-highlight-active hover:bg-secondary/60 transition-colors duration-200"
          >
            <PixelFolderIcon className="size-5" />
            <span className="text-sm font-medium text-foreground">New Vault</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateType('note')
              if (!activeVaultId && vaults.length > 0) {
                setSelectedVaultId(vaults[0].id)
              }
            }}
            disabled={vaults.length === 0 && !activeVaultId}
            className="flex min-h-12 w-full items-center gap-3 rounded-[3px] px-3 text-left touch-highlight-active hover:bg-secondary/60 transition-colors duration-200 disabled:opacity-40"
          >
            <PixelMasterNoteIcon className="size-5" />
            <span className="text-sm font-medium text-foreground">New Master Note</span>
          </button>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        open={createOpen && createType === 'vault'}
        onClose={() => {
          setCreateOpen(false)
          setCreateType(null)
        }}
        title="New Vault"
      >
        <form onSubmit={handleCreateVault} className="flex flex-col gap-4">
          <input
            autoFocus
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            placeholder="Subject name"
            className="field-input"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreateType(null)
                setVaultName('')
              }}
            >
              Back
            </Button>
            <Button type="submit" size="sm">
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={createOpen && createType === 'note'}
        onClose={() => {
          setCreateOpen(false)
          setCreateType(null)
        }}
        title="New Master Note"
      >
        <form onSubmit={handleCreateNote} className="flex flex-col gap-4">
          <input
            autoFocus
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Topic or chapter"
            className="field-input"
          />

          {!activeVaultId && vaults.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vault-select" className="text-xs font-medium text-muted-foreground">
                Vault
              </label>
              <select
                id="vault-select"
                value={selectedVaultId}
                onChange={(e) => setSelectedVaultId(e.target.value)}
                className="field-input"
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreateType(null)
                setNoteTitle('')
              }}
            >
              Back
            </Button>
            <Button type="submit" size="sm">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
