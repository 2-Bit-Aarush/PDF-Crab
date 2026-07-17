'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Plus, X, ChevronDown, Search, User, Settings } from 'lucide-react'
import { useVaults } from '@/lib/vault-store'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PixelFolderIcon, PixelMasterNoteIcon } from '@/components/pixel-icons'

const NAV_ITEMS = [
  { label: 'Vaults', href: '/dashboard', icon: PixelFolderIcon },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

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
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/vault/')
  const isSearch = pathname === '/search'
  const isProfile = pathname === '/profile'
  const isSettings = pathname === '/settings'

  useEffect(() => {
    if (createType === 'note' && !activeVaultId && vaults.length > 0 && !selectedVaultId) {
      setSelectedVaultId(vaults[0].id)
    }
  }, [createType, activeVaultId, vaults, selectedVaultId])

  function handleCreateClick(e: React.MouseEvent) {
    e.preventDefault()
    setCreateOpen(true)
    setCreateType(null)
  }

  async function handleCreateVault(e: React.FormEvent) {
    e.preventDefault()
    const name = vaultName.trim()
    if (!name) return
    try {
      const id = await createVault(name)
      setVaultName('')
      setCreateType(null)
      setCreateOpen(false)
      router.push(`/vault/${id}`)
    } catch (err: any) {
      console.error('Failed to create vault:', err)
      const errMsg = err.message || err.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      alert(`Error creating vault:\n${errMsg}`)
    }
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault()
    const title = noteTitle.trim()
    const targetVaultId = activeVaultId || selectedVaultId || (vaults.length > 0 ? vaults[0].id : '')
    if (!title || !targetVaultId) return
    try {
      const id = await createMasterNote(targetVaultId, title)
      setNoteTitle('')
      setSelectedVaultId('')
      setCreateType(null)
      setCreateOpen(false)
      router.push(`/master/${id}`)
    } catch (err: any) {
      console.error('Failed to create master note:', err)
      const errMsg = err.message || err.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      alert(`Error creating master note:\n${errMsg}`)
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm pb-safe animate-slide-up">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-2 py-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium tracking-tight transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] touch-highlight relative',
                  active
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 rounded-[8px]'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <div className={cn(
                  'size-5 shrink-0 transition-all duration-200',
                  active && 'animate-pulse-soft text-accent'
                )}>
                  <item.icon />
                </div>
                <span className="font-brand">{item.label}</span>
                {active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-accent animate-pulse-soft" aria-hidden="true" />
                )}
              </Link>
            )
          })}

          <button
            type="button"
            onClick={handleCreateClick}
            className={cn(
              'relative flex min-h-12 min-w-[64px] flex-1 flex-col items-center justify-center gap-1 py-1.5',
              'text-muted-foreground hover:text-foreground transition-all duration-180 touch-highlight'
            )}
            aria-label="Create new vault or master note"
          >
            <span className="flex size-10 items-center justify-center rounded-[8px] bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-sm hover:shadow-md hover:from-accent/90 hover:to-primary/90 active:scale-[0.95] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="font-brand text-[10px] uppercase tracking-wider">Create</span>
          </button>
        </div>
      </nav>

      <Modal open={createOpen && !createType} onClose={() => setCreateOpen(false)} title="Create New" description="What would you like to create?">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setCreateType('vault')}
            className="flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 text-left touch-highlight hover:bg-secondary/60 transition-colors duration-180"
          >
            <PixelFolderIcon className="size-5 text-accent" />
            <span className="text-sm font-medium text-foreground">New Vault</span>
            <span className="ml-auto text-xs text-muted-foreground">Subject, course, project</span>
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
            className="flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 text-left touch-highlight hover:bg-secondary/60 transition-colors duration-180 disabled:opacity-40"
          >
            <PixelMasterNoteIcon className="size-5 text-accent" />
            <span className="text-sm font-medium text-foreground">New Master Note</span>
            <span className="ml-auto text-xs text-muted-foreground">Compile sources into one note</span>
          </button>
          <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        open={createOpen && createType === 'vault'}
        onClose={() => {
          setCreateOpen(false)
          setCreateType(null)
          setVaultName('')
        }}
        title="New Vault"
        description="Create a vault for each subject you study."
      >
        <form onSubmit={handleCreateVault} className="flex flex-col gap-4">
          <Input
            autoFocus
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            placeholder="e.g. Operating Systems"
            label="Vault Name"
            hint="This will be the subject or category name"
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
            <Button type="submit" size="sm" disabled={!vaultName.trim()}>
              Create Vault
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={createOpen && createType === 'note'}
        onClose={() => {
          setCreateOpen(false)
          setCreateType(null)
          setNoteTitle('')
        }}
        title="New Master Note"
        description="Add a title and select which vault it belongs to."
      >
        <form onSubmit={handleCreateNote} className="flex flex-col gap-4">
          <Input
            autoFocus
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Topic or chapter"
            label="Note Title"
            hint="What is this note about?"
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
            <Button type="submit" size="sm" disabled={!noteTitle.trim() || (!activeVaultId && vaults.length === 0)}>
              Create Note
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}