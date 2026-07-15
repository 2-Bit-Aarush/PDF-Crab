'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { KebabMenu } from '@/components/ui/kebab-menu'
import { ArrowLeft, Plus, Search, ChevronRight } from 'lucide-react'
import { PixelDocIcon, PixelFolderIcon, PixelMasterNoteIcon } from '@/components/pixel-icons'
import { PixelProgress } from '@/components/pixel-progress'
import { EmptyArchive } from '@/components/empty-archive'
import { useMascot } from '@/components/mascot/mascot-context'

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
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { setOverride } = useMascot()

  const notes = useMemo(() => {
    if (!vault) return []
    return vault.masterNotes.filter((n) =>
      n.title.toLowerCase().includes(query.trim().toLowerCase()),
    )
  }, [vault, query])

  const isNotesEmpty = notes.length === 0

  useEffect(() => {
    if (deleteOpen) {
      setOverride({ category: 'delete', state: 'deleting' })
    } else if (isNotesEmpty) {
      setOverride({ category: 'empty' })
    } else {
      setOverride(null)
    }
    return () => setOverride(null)
  }, [deleteOpen, isNotesEmpty, setOverride])

  if (!vault) {
    return (
      <div className="page-shell text-center">
        <p className="text-sm text-muted-foreground">This vault is not in the archive.</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push('/dashboard')}>
          Back to Vaults
        </Button>
      </div>
    )
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    const title = noteTitle.trim()
    if (!title) return
    const id = await createMasterNote(vault!.id, title)
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
    <div className="page-shell">
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-xs font-sans text-muted-foreground transition-colors duration-200 hover:text-foreground touch-highlight-active"
      >
        <ArrowLeft className="size-3.5" />
        Vaults
      </button>

      <header className="page-header flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <PixelFolderIcon className="size-5 shrink-0 text-accent/60" />
            <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{vault.name}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {vault.masterNotes.length} master notes in this vault.
          </p>
        </div>
        <KebabMenu
          items={[
            {
              label: 'Rename',
              onSelect: () => {
                setRenameValue(vault.name)
                setRenameOpen(true)
              },
            },
            {
              label: 'Remove',
              destructive: true,
              onSelect: () => setDeleteOpen(true),
            },
          ]}
        />
      </header>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter master notes..."
          className="field-input pl-10"
        />
      </div>

      <section className="mt-8">
        {notes.length === 0 ? (
          <div className="flex flex-col gap-8">
            <EmptyArchive
              icons={
                <>
                  <PixelDocIcon className="size-9" />
                  <PixelMasterNoteIcon className="size-9 text-accent/50" />
                </>
              }
              title="No master notes yet"
              description="Compile scattered sources into one structured note."
              action={
                <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
                  <Plus className="size-3.5" />
                  New Master Note
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {notes.map((note, i) => (
              <div key={note.id}>
                {i > 0 && <hr className="pixel-divider" />}
                <div
                  onClick={() => router.push(`/master/${note.id}`)}
                  className="list-row touch-highlight-active group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h3 className="text-[15px] font-medium text-foreground group-hover:text-accent transition-colors duration-200 truncate">
                      {note.title}
                    </h3>
                    <p className="mt-1 font-brand text-[10px] text-muted-foreground tracking-wide">
                      {note.sources.length} sources · {note.generated ? 'compiled' : 'draft'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <PixelProgress value={note.coverage} maxBlocks={8} />
                      <span className="font-brand text-[10px] text-accent/70 uppercase">
                        {note.coverage}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-[18px] text-muted-foreground/50 group-hover:text-foreground transition-colors duration-200 shrink-0" />
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
              New Master Note
            </button>
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Master Note">
        <form onSubmit={submitCreate} className="flex flex-col gap-4">
          <input
            autoFocus
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Topic or chapter"
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

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename Vault">
        <form onSubmit={submitRename} className="flex flex-col gap-4">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="field-input"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Vault">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground leading-relaxed">
            Remove <strong className="text-accent">{vault.name}</strong> and everything inside it?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                deleteVault(vault.id)
                setDeleteOpen(false)
                router.push('/dashboard')
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
