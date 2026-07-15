'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVaults, type Vault } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { KebabMenu } from '@/components/ui/kebab-menu'
import { Search, Plus, FileText } from 'lucide-react'
import { PixelFolderIcon } from '@/components/pixel-icons'

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
  const [query, setQuery] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const [renameTarget, setRenameTarget] = useState<Vault | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const filtered = useMemo(
    () => vaults.filter((v) => v.name.toLowerCase().includes(query.trim().toLowerCase())),
    [vaults, query],
  )

  function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const id = createVault(name)
    setNewName('')
    setCreateOpen(false)
    router.push(`/vault/${id}`)
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renameTarget) return
    const name = renameValue.trim()
    if (name) renameVault(renameTarget.id, name)
    setRenameTarget(null)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
            PDF-Crab
          </span>
          <p className="text-xs text-muted-foreground tracking-wide uppercase font-semibold">
            Knowledge Workspace
          </p>
        </div>

        {/* Search Viewport */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vaults..."
            className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
      </header>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            My Vaults ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/20 p-10 text-center">
            <PixelFolderIcon className="mx-auto mb-3 text-muted-foreground/35 size-11" />
            <p className="text-sm text-muted-foreground">
              No vaults found. Create one to begin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((vault, i) => (
              <div key={vault.id}>
                {i > 0 && <hr className="pixel-divider" />}
                <div
                  onClick={() => router.push(`/vault/${vault.id}`)}
                  className="flex items-center justify-between py-4 cursor-pointer touch-highlight-active group rounded-lg"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <h3 className="text-[15px] font-medium text-foreground group-hover:text-accent transition-colors truncate">
                      {vault.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3" />
                        {vault.masterNotes.length} notes
                      </span>
                      <span>•</span>
                      <span>{sourceCount(vault)} sources</span>
                      <span>•</span>
                      <span className="truncate">Upd. {formatDate(vault.updatedAt)}</span>
                    </div>
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
                        label: 'Delete',
                        destructive: true,
                        onSelect: () => deleteVault(vault.id),
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
            
            <hr className="pixel-divider" />
            
            {/* Inline Action Trigger */}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex w-full items-center py-4 text-sm font-semibold text-accent/80 hover:text-accent active:opacity-90 justify-center border border-dashed border-border/60 rounded-lg transition-colors mt-4 touch-highlight-active"
            >
              <Plus className="size-4 mr-1.5" />
              Create Vault
            </button>
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Vault">
        <form onSubmit={submitCreate} className="flex flex-col gap-4">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Vault name"
            className="h-11 rounded-lg border border-input bg-secondary px-3.5 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-lg"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
            >
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
            className="h-11 rounded-lg border border-input bg-secondary px-3.5 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-lg"
              onClick={() => setRenameTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
