'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { Search as SearchIcon } from 'lucide-react'
import { PixelFolderIcon, PixelMasterNoteIcon } from '@/components/pixel-icons'
import { useMascot } from '@/components/mascot/mascot-context'

export default function SearchPage() {
  const router = useRouter()
  const { vaults } = useVaults()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { vaults: [], notes: [] }
    const vaultHits = vaults.filter((v) => v.name.toLowerCase().includes(q))
    const noteHits = vaults.flatMap((v) =>
      v.masterNotes
        .filter((n) => n.title.toLowerCase().includes(q))
        .map((n) => ({ note: n, vault: v })),
    )
    return { vaults: vaultHits, notes: noteHits }
  }, [vaults, query])

  const hasQuery = query.trim().length > 0
  const empty = hasQuery && results.vaults.length === 0 && results.notes.length === 0
  const { setOverride } = useMascot()

  useEffect(() => {
    if (!hasQuery) {
      setOverride({ dialogue: 'Tell me what you are looking for. I am good at finding things.' })
    } else if (empty) {
      setOverride({ dialogue: 'I looked everywhere. Under the rocks. Behind the weeds. Nothing.', emotion: 'confused' })
    } else {
      setOverride(null)
    }
    return () => setOverride(null)
  }, [hasQuery, empty, setOverride])

  return (
    <div className="page-shell">
      <header className="page-header flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground">Search the archive.</p>
      </header>

      <div className="relative mt-5">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/50" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Searching archive..."
          className="field-input pl-10"
        />
      </div>

      {!hasQuery ? (
        <div className="mt-12 flex flex-col gap-8">
          <p className="text-center text-sm text-muted-foreground">
            Find vaults and master notes by name.
          </p>
        </div>
      ) : empty ? (
        <div className="mt-12 flex flex-col gap-8">
          <p className="text-center text-sm text-muted-foreground">
            Nothing matched &ldquo;{query}&rdquo; in the archive.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {results.vaults.length > 0 ? (
            <section>
              <h2 className="mb-1 text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
                Vaults · {results.vaults.length}
              </h2>
              <div className="flex flex-col">
                {results.vaults.map((v, i) => (
                  <div key={v.id}>
                    {i > 0 && <hr className="pixel-divider" />}
                    <button
                      type="button"
                      onClick={() => router.push(`/vault/${v.id}`)}
                      className="list-row w-full text-left touch-highlight-active group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <PixelFolderIcon className="size-4 shrink-0 text-accent/60" />
                        <span className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors duration-200">
                          {v.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {v.masterNotes.length} notes
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {results.notes.length > 0 ? (
            <section>
              <h2 className="mb-1 text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
                Master notes · {results.notes.length}
              </h2>
              <div className="flex flex-col">
                {results.notes.map(({ note, vault }, i) => (
                  <div key={note.id}>
                    {i > 0 && <hr className="pixel-divider" />}
                    <button
                      type="button"
                      onClick={() => router.push(`/master/${note.id}`)}
                      className="list-row w-full text-left touch-highlight-active group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <PixelMasterNoteIcon className="size-4 shrink-0 text-accent/60" />
                        <span className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors duration-200">
                          {note.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 max-w-[120px] truncate font-sans">
                        {vault.name}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
