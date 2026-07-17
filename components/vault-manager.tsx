'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVaults, type Vault } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Modal, AlertDialog } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { KebabMenu } from '@/components/ui/kebab-menu'
import { Search, Plus, X } from 'lucide-react'
import { PixelFolderIcon, PixelArchiveIcon, PixelMasterNoteIcon } from '@/components/pixel-icons'
import { EmptyArchive } from '@/components/empty-archive'
import { useMascot } from '@/components/mascot/mascot-context'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/reveal'

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
      const id = await createVault(name)
      setNewName('')
      setCreateOpen(false)
      router.push(`/vault/${id}`)
    } catch (err: any) {
      console.error('[submitCreate] Failed:', err)
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
        <Reveal>
          <div className="flex items-center gap-2">
            <PixelFolderIcon className="size-6 text-accent" />
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              PDF<span className="text-accent">-</span>Crab
            </span>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="page-header flex flex-col gap-0.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Vaults</h1>
            <p className="text-sm text-muted-foreground">Subjects, courses, and collections.</p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter vaults..."
              className="pl-10"
              label="Search vaults"
            />
          </div>
        </Reveal>
      </header>

      <section className="mt-8" aria-label="Vault archive">
        <Reveal delay={180}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Archive · {filtered.length}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              New Vault
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col gap-8 mt-4">
              <EmptyArchive
                icons={
                  <>
                    <PixelFolderIcon className="size-10" />
                    <PixelArchiveIcon className="size-10 text-accent/50" />
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
                <Reveal key={vault.id} delay={i * 20}>
                  <div>
                    {i > 0 && <hr className="pixel-divider" />}
                    <button
                      type="button"
                      onClick={() => router.push(`/vault/${vault.id}`)}
                      className={cn(
                        'list-row touch-highlight-active group w-full text-left',
                        'transition-colors duration-180'
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2.5">
                          <PixelFolderIcon className="size-5 shrink-0 text-accent/70" />
                          <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors duration-180 truncate">
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
                            icon: <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                          },
                          {
                            label: 'Remove',
                            destructive: true,
                            onSelect: () => setDeleteTarget(vault),
                            icon: <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
                          },
                        ]}
                      />
                    </button>
                  </div>
                </Reveal>
              ))}

              <hr className="pixel-divider mt-2" />

              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={cn(
                  'mt-3 flex w-full min-h-12 items-center justify-center gap-1.5',
                  'text-sm font-semibold text-accent/80 hover:text-accent',
                  'touch-highlight-active transition-colors duration-200'
                )}
              >
                <Plus className="size-4" />
                New Vault
              </button>
            </div>
          )}
        </Reveal>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Vault" description="Create a vault for each subject you study.">
        <form onSubmit={submitCreate} className="flex flex-col gap-4">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Operating Systems"
            label="Vault Name"
            hint="Subject, course, or project name"
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

      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename Vault" description="Enter a new name for this vault.">
        <form onSubmit={submitRename} className="flex flex-col gap-4">
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            label="New Name"
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

      <AlertDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Vault"
        description={
          <>
            Remove <strong className="text-accent">{deleteTarget?.name}</strong> and everything inside it?
            <br /><br />
            <span className="text-destructive/80 font-medium">This action cannot be undone.</span>
          </>
        }
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteTarget) {
            deleteVault(deleteTarget.id)
            setDeleteTarget(null)
          }
        }}
        variant="destructive"
      />
    </div>
  )
}