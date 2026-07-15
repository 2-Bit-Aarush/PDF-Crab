'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { KebabMenu } from '@/components/ui/kebab-menu'
import { ArrowLeft, Plus, Search, FileText, ChevronRight } from 'lucide-react'
import { PixelDocIcon } from '@/components/pixel-icons'
import { PixelProgress } from '@/components/pixel-progress'

export default function VaultDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { getVault, renameVault, deleteVault, createMasterNote } = useVaults()
  const vault = getVault(params.id)

  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const notes = useMemo(() => {
    if (!vault) return []
    return vault.masterNotes.filter((n) =>
      n.title.toLowerCase().includes(query.trim().toLowerCase()),
    )
  }, [vault, query])

  if (!vault) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">This vault could not be found.</p>
        <Button className="mt-4 rounded-lg" variant="secondary" onClick={() => router.push('/dashboard')}>
          Back to Vaults
        </Button>
      </div>
    )
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    const title = noteTitle.trim()
    if (!title) return
    const id = createMasterNote(vault!.id, title)
    setNoteTitle('')
    setCreateOpen(false)
    router.push(`/master/${id}`)
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault()
    const name = renameValue.trim()
    if (name) renameVault(vault!.id, name)
    setRenameOpen(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground touch-highlight-active p-1 rounded"
      >
        <ArrowLeft className="size-4" />
        Vaults
      </button>

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            {vault.name}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {vault.masterNotes.length} Master Notes
          </p>
        </div>
        <KebabMenu
          items={[
            {
              label: 'Rename Vault',
              onSelect: () => {
                setRenameValue(vault.name)
                setRenameOpen(true)
              },
            },
            {
              label: 'Delete Vault',
              destructive: true,
              onSelect: () => {
                deleteVault(vault.id)
                router.push('/dashboard')
              },
            },
          ]}
        />
      </header>

      {/* Search Input */}
      <div className="mt-6 relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search master notes..."
          className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      <section className="mt-8">
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/20 p-10 text-center">
            <PixelDocIcon className="mx-auto mb-3 text-muted-foreground/35 size-11" />
            <p className="text-sm text-muted-foreground">
              No master notes yet. Create one to begin.
            </p>
            
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              <Plus className="size-4" />
              Create Master Note
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {notes.map((note, i) => (
              <div key={note.id}>
                {i > 0 && <hr className="pixel-divider" />}
                <div
                  onClick={() => router.push(`/master/${note.id}`)}
                  className="flex items-center justify-between py-4 cursor-pointer touch-highlight-active group rounded-lg"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <h3 className="text-[15px] font-medium text-foreground group-hover:text-accent transition-colors truncate">
                      {note.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {note.sources.length} sources • {note.generated ? 'Generated' : 'Draft'}
                    </p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <PixelProgress value={note.coverage} maxBlocks={8} />
                      <span className="text-[10px] font-semibold text-accent/80 tracking-wide uppercase">
                        {note.coverage}% coverage
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-[18px] text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
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
              Create Master Note
            </button>
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Master Note">
        <form onSubmit={submitCreate} className="flex flex-col gap-4">
          <input
            autoFocus
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Master note title"
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

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename Vault">
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
              onClick={() => setRenameOpen(false)}
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
