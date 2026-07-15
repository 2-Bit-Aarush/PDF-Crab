'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVaults, type Vault } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { KebabMenu } from '@/components/ui/kebab-menu'
import { Search, Plus } from 'lucide-react'
import { PixelFolderIcon, PixelArchiveIcon } from '@/components/pixel-icons'
import { EmptyArchive } from '@/components/empty-archive'
import { useMascot } from '@/components/mascot/mascot-context'

function sourceCount(vault: Vault) {
  return vault.masterNotes.reduce((sum, n) => sum + n.sources.length, 0)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function VaultManager() {
  const router = useRouter()
  const { vaults, createVault, renameVault, deleteVault } = useVaults()
  const { setOverride } = useMascot()
  const [query, setQuery] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const [renameTarget, setRenameTarget] = useState<Vault | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Vault | null>(null)

  const filtered = useMemo(
    () => vaults.filter((v) => v.name.toLowerCase().includes(query.trim().toLowerCase())),
    [vaults, query],
  )

  const isVaultsEmpty = filtered.length === 0
  const isDeleting = !!deleteTarget

  useEffect(() => {
    if (isDeleting) {
      setOverride({ category: 'delete', state: 'deleting' })
    } else if (isVaultsEmpty) {
      setOverride({ category: 'empty' })
    } else {
      setOverride(null)
    }
    return () => setOverride(null)
  }, [isDeleting, isVaultsEmpty, setOverride])

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    try {
      console.log('[submitCreate] Creating vault: stage Init with name:', name)
      const id = await createVault(name)
      console.log('[submitCreate] createVault stage Success. ID:', id)
      setNewName('')
      setCreateOpen(false)
      console.log('[submitCreate] Navigating to /vault/' + id)
      router.push(`/vault/${id}`)
    } catch (err: any) {
      console.error('[submitCreate] Failed to create vault stage Error:', err)
      if (err && typeof err === 'object') {
        console.error("Supabase Error:", err)
        console.error("Code:", err.code)
        console.error("Message:", err.message)
        console.error("Details:", err.details)
        console.error("Hint:", err.hint)
        console.error("Status:", err.status)
      }
      const errMsg = err.message || err.details || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      alert(`Error creating vault:\n${errMsg}`)
    }
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renameTarget) return
    const name = renameValue.trim()
    if (name) renameVault(renameTarget.id, name)
    setRenameTarget(null)
  }

  return (
    <div className="page-shell">
      <header className="flex flex-col gap-4">
        <span className="font-brand text-xl font-semibold tracking-tight text-foreground">
          PDF-Crab
        </span>
        <div className="page-header flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Vaults</h1>
          <p className="text-sm text-muted-foreground">Subjects, courses, and collections.</p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter vaults..."
            className="field-input pl-10"
          />
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-1 text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
          Archive · {filtered.length}
        </h2>

        {filtered.length === 0 ? (
          <div className="flex flex-col gap-8 mt-4">
            <EmptyArchive
              icons={
                <>
                  <PixelFolderIcon className="size-9" />
                  <PixelArchiveIcon className="size-9 text-accent/50" />
                </>
              }
              title="No vaults yet"
              description="Create a vault for each subject you study."
              action={
                <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
                  <Plus className="size-3.5" />
                  New Vault
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((vault, i) => (
              <div key={vault.id}>
                {i > 0 && <hr className="pixel-divider" />}
                <div
                  onClick={() => router.push(`/vault/${vault.id}`)}
                  className="list-row touch-highlight-active group"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2.5">
                      <PixelFolderIcon className="size-4 shrink-0 text-accent/60" />
                      <h3 className="text-[15px] font-medium text-foreground group-hover:text-accent transition-colors duration-200 truncate">
                        {vault.name}
                      </h3>
                    </div>
                    <p className="mt-1 font-brand text-[10px] text-muted-foreground tracking-wide">
                      {vault.masterNotes.length} notes · {sourceCount(vault)} sources · {formatDate(vault.updatedAt)}
                    </p>
                  </div>
                  <KebabMenu
                    items={[
                      {
                        label: 'Rename',
                        onSelect: () => {
                          setRenameTarget(vault)
                          setRenameValue(vault.name)
                        },
                      },
                      {
                        label: 'Remove',
                        destructive: true,
                        onSelect: () => setDeleteTarget(vault),
                      },
                    ]}
                  />
                </div>
              </div>
            ))}

            <hr className="pixel-divider mt-2" />

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-3 flex w-full min-h-12 items-center justify-center gap-1.5 text-sm font-semibold text-accent/80 hover:text-accent touch-highlight-active transition-colors duration-200"
            >
              <Plus className="size-4" />
              New Vault
            </button>
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Vault">
        <form onSubmit={submitCreate} className="flex flex-col gap-4">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Operating Systems"
            className="field-input"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename Vault">
        <form onSubmit={submitRename} className="flex flex-col gap-4">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="field-input"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Vault">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground leading-relaxed">
            Remove <strong className="text-accent">{deleteTarget?.name}</strong> and everything inside it?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteTarget) {
                  deleteVault(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
