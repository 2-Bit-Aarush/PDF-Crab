'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { Search as SearchIcon, Folder, FileText } from 'lucide-react'

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

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Search</h1>
        <p className="text-xs text-muted-foreground">Find vaults and master notes.</p>
      </header>

      <div className="relative mt-5">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/60" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything..."
          className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      {!hasQuery ? (
        <p className="mt-12 text-center text-xs text-muted-foreground">
          Type to search across your workspace vaults and notes.
        </p>
      ) : empty ? (
        <p className="mt-12 text-center text-xs text-muted-foreground">
          No results found for &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {results.vaults.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vaults ({results.vaults.length})
              </h2>
              <div className="flex flex-col">
                {results.vaults.map((v, i) => (
                  <div key={v.id}>
                    {i > 0 && <hr className="pixel-divider" />}
                    <button
                      onClick={() => router.push(`/vault/${v.id}`)}
                      className="flex w-full items-center justify-between py-3.5 text-left touch-highlight-active rounded-lg group"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-4">
                        <Folder className="size-[18px] text-muted-foreground/60 group-hover:text-accent transition-colors shrink-0" />
                        <span className="truncate text-sm text-foreground group-hover:text-accent transition-colors font-medium">
                          {v.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
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
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Master Notes ({results.notes.length})
              </h2>
              <div className="flex flex-col">
                {results.notes.map(({ note, vault }, i) => (
                  <div key={note.id}>
                    {i > 0 && <hr className="pixel-divider" />}
                    <button
                      onClick={() => router.push(`/master/${note.id}`)}
                      className="flex w-full items-center justify-between py-3.5 text-left touch-highlight-active rounded-lg group"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-4">
                        <FileText className="size-[18px] text-muted-foreground/60 group-hover:text-accent transition-colors shrink-0" />
                        <span className="truncate text-sm text-foreground group-hover:text-accent transition-colors font-medium">
                          {note.title}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0 max-w-[120px] truncate">
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
