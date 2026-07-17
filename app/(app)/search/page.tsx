'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { Search as SearchIcon } from 'lucide-react'
import { PixelFolderIcon, PixelMasterNoteIcon, PixelDocIcon, PixelPdfIcon } from '@/components/pixel-icons'
import { Sparkles } from 'lucide-react'
import { useMascot } from '@/components/mascot/mascot-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Reveal } from '@/components/reveal'
import { EmptyArchive } from '@/components/empty-archive'
import { cn } from '@/lib/utils'

export default function SearchPage() {
  const router = useRouter()
  const { vaults } = useVaults()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const { setOverride } = useMascot()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { vaults: [], notes: [], sections: [] }
    
    const vaultHits = vaults.filter((v) => v.name.toLowerCase().includes(q))
    const noteHits = vaults.flatMap((v) =>
      v.masterNotes
        .filter((n) => n.title.toLowerCase().includes(q))
        .map((n) => ({ note: n, vault: v })),
    )
    
    const sectionHits = vaults.flatMap((v) =>
      v.masterNotes.flatMap((n) =>
        n.sections
          .filter((s) => s.heading.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
          .map((s) => ({ section: s, note: n, vault: v })),
      ),
    )
    
    return { vaults: vaultHits, notes: noteHits, sections: sectionHits }
  }, [vaults, query])

  const hasQuery = query.trim().length > 0
  const empty = hasQuery && results.vaults.length === 0 && results.notes.length === 0 && results.sections.length === 0

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

  const handleSearchChange = (value: string) => {
    setQuery(value)
  }

  const clearSearch = () => {
    setQuery('')
    setSearching(false)
  }

  return (
    <div className="page-shell">
      
      <header className="page-header flex flex-col gap-0.5">
        <Reveal>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-5 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">Search Archive</h1>
          </div>
          <p className="text-sm text-muted-foreground">Find vaults, master notes, and content across your knowledge base.</p>
        </Reveal>

        <Reveal delay={60}>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search vaults, notes, formulas, definitions..."
              className={cn('pl-10', hasQuery && 'pr-10')}
              label="Search"
              leftIcon={<SearchIcon className="size-4" />}
              rightIcon={hasQuery && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              )}
            />
          </div>
        </Reveal>
      </header>

      {!hasQuery ? (
        <Reveal delay={120} className="mt-12">
          <EmptyArchive
            icons={
              <>
                <PixelDocIcon className="size-10" />
                <Sparkles className="size-10 text-accent/50" />
              </>
            }
            title="Search your archive"
            description="Type a query to find vaults, master notes, and sections across all your compiled knowledge."
            action={
              <Button variant="ghost" size="sm" onClick={() => setQuery('compiler')}>
                Try: "compiler"
              </Button>
            }
          />
        </Reveal>
      ) : empty ? (
        <Reveal delay={120} className="mt-12">
          <EmptyArchive
            icons={
              <>
                <PixelFolderIcon className="size-10" />
                <PixelDocIcon className="size-10 text-muted-foreground/30" />
              </>
            }
            title="Nothing matched"
            description={`No results found for &ldquo;{query}&rdquo; in the archive.`}
            action={
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            }
          />
        </Reveal>
      ) : (
        <Reveal delay={120} className="mt-8 space-y-8">
          {results.vaults.length > 0 && (
            <section className="space-y-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vaults · {results.vaults.length}
                </h2>
              </div>
              <div className="flex flex-col">
                {results.vaults.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => router.push(`/vault/${v.id}`)}
                    className={cn('list-row w-full text-left touch-highlight-active group', i > 0 && 'border-t border-border/50')}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-4">
                      <PixelFolderIcon className="size-4 shrink-0 text-accent/60" />
                      <span className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors duration-200">
                        {v.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {v.masterNotes.length} note{v.masterNotes.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {results.notes.length > 0 && (
            <section className="space-y-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Master Notes · {results.notes.length}
                </h2>
              </div>
              <div className="flex flex-col">
                {results.notes.map(({ note, vault }, i) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => router.push(`/master/${note.id}`)}
                    className={cn('list-row w-full text-left touch-highlight-active group', i > 0 && 'border-t border-border/50')}
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
                ))}
              </div>
            </section>
          )}

          {results.sections.length > 0 && (
            <section className="space-y-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sections · {results.sections.length}
                </h2>
              </div>
              <div className="flex flex-col">
                {results.sections.slice(0, 10).map(({ section, note, vault }, i) => (
                  <button
                    key={`${note.id}-${section.id}`}
                    type="button"
                    onClick={() => router.push(`/master/${note.id}`)}
                    className={cn('list-row w-full text-left touch-highlight-active group', i > 0 && 'border-t border-border/50')}
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <PixelDocIcon className="size-3.5 shrink-0 text-accent/60" />
                        <span className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors duration-200">
                          {section.heading}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground truncate flex items-center gap-1">
                        <PixelMasterNoteIcon className="size-2.5" />
                        <span className="truncate">{note.title}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="truncate">{vault.name}</span>
                      </p>
                    </div>
                  </button>
                ))}
                {results.sections.length > 10 && (
                  <p className="px-1 py-3 text-xs text-muted-foreground/60 text-center">
                    And {results.sections.length - 10} more sections...
                  </p>
                )}
              </div>
            </section>
          )}
        </Reveal>
      )}
    </div>
  )
}