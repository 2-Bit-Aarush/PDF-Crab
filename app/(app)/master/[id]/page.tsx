'use client'

import { useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Sparkles,
  Download,
  Plus,
  FileText,
  Clock,
  UploadCloud,
  X,
  ChevronRight,
} from 'lucide-react'
import { PixelDocIcon, PixelCrabIcon } from '@/components/pixel-icons'
import { PixelProgress } from '@/components/pixel-progress'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'generated-notes', label: 'Notes' },
  { id: 'sources', label: 'Sources' },
  { id: 'formula-sheet', label: 'Formulas' },
  { id: 'definitions', label: 'Definitions' },
  { id: 'knowledge-timeline', label: 'Timeline' },
  { id: 'export', label: 'Export' },
] as const

type TabId = (typeof TABS)[number]['id']

const GENERATING_PHASES = [
  { label: 'Reading Sources...', progress: 20 },
  { label: 'Extracting Text...', progress: 45 },
  { label: 'Detecting Topics...', progress: 65 },
  { label: 'Building Knowledge...', progress: 85 },
  { label: 'Master Note Complete', progress: 100 },
]

export default function MasterNotePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { getMasterNote, generateMasterNote, addSource } = useVaults()
  const result = getMasterNote(params.id)

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [generatingPhase, setGeneratingPhase] = useState<number>(-1)

  function handleGenerate() {
    if (!result) return
    if (generatingPhase !== -1) return
    setGeneratingPhase(0)
    
    const interval = setInterval(() => {
      setGeneratingPhase((prev) => {
        if (prev >= GENERATING_PHASES.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            generateMasterNote(result.note.id)
            setGeneratingPhase(-1)
            setActiveTab('generated-notes')
          }, 800)
          return prev
        }
        return prev + 1
      })
    }, 700)
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">This master note could not be found.</p>
        <Button className="mt-4 rounded-lg" variant="secondary" onClick={() => router.push('/dashboard')}>
          Back to Vaults
        </Button>
      </div>
    )
  }

  const { note, vault } = result

  function addFiles(list: FileList | null) {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list).map((f) => f.name)])
  }

  function handleAttach() {
    if (files.length === 0) return
    files.forEach((name) => addSource(note.id, name.endsWith('.pdf') ? name : `${name}.pdf`))
    setFiles([])
    setUploadOpen(false)
    setActiveTab('sources')
  }

  function handleExport() {
    const body =
      `# ${note.title}\n\n` +
      note.sections.map((s) => `## ${s.heading}\n\n${s.body}\n`).join('\n')
    const blob = new Blob([body], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title.replace(/\s+/g, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <button
        onClick={() => router.push(`/vault/${vault.id}`)}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground touch-highlight-active p-1 rounded"
      >
        <ArrowLeft className="size-4" />
        {vault.name}
      </button>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {note.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          {note.generated ? 'Generated Note' : 'Draft workspace'}
        </p>

        {/* Note action buttons - Thumb reachable */}
        <div className="flex gap-2 mt-4">
          <Button
            size="lg"
            onClick={handleGenerate}
            className="h-11 flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 touch-highlight-active font-semibold"
          >
            <Sparkles className="size-4 mr-1.5" />
            Generate
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setUploadOpen(true)}
            className="h-11 flex-1 rounded-lg touch-highlight-active font-semibold"
          >
            <Plus className="size-4 mr-1.5" />
            Add Sources
          </Button>
        </div>
      </header>

      {/* Horizontally scrollable tabs menu */}
      <nav
        aria-label="Workspace tabs"
        className="mt-6 flex gap-1 overflow-x-auto scrollbar-none border-b border-border/60 pb-2 bg-transparent"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors touch-highlight-active',
              activeTab === tab.id
                ? 'bg-secondary text-accent border border-accent/25'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' ? (
          <div className="flex flex-col gap-6">
            
            {/* Coverage gauge */}
            <div className="py-2">
              <div className="flex items-end justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coverage</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold tracking-tight text-foreground">{note.coverage}</span>
                  <span className="text-xs text-muted-foreground font-semibold">%</span>
                </div>
              </div>
              <PixelProgress value={note.coverage} maxBlocks={12} className="mt-3.5" />
              <p className="mt-2.5 text-[11px] text-muted-foreground/80">
                Share of uploaded notes merged into this master note.
              </p>
            </div>

            <hr className="pixel-divider" />

            {/* Sources list summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sources · {note.sources.length}
                </h2>
                {note.sources.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('sources')}
                    className="text-[11px] font-semibold text-accent hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              {note.sources.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">No sources added yet.</p>
              ) : (
                <ul className="flex flex-col">
                  {note.sources.slice(0, 3).map((s, idx) => (
                    <div key={s.id}>
                      {idx > 0 && <hr className="pixel-divider" />}
                      <li className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2 min-w-0 pr-4">
                          <FileText className="size-[18px] text-muted-foreground/60 shrink-0" />
                          <span className="truncate text-sm text-foreground">{s.name}</span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground shrink-0">{s.pages} pages</span>
                      </li>
                    </div>
                  ))}
                </ul>
              )}
            </div>

            <hr className="pixel-divider" />

            {/* Timeline summary */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Timeline Summary
                </h2>
                {note.timeline.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('knowledge-timeline')}
                    className="text-[11px] font-semibold text-accent hover:underline"
                  >
                    View Full
                  </button>
                )}
              </div>
              {note.timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">No timeline entries yet.</p>
              ) : (
                <div className="relative pl-6">
                  {/* Vertical Dotted line accent */}
                  <div className="absolute left-[7px] top-1.5 bottom-1.5 pixel-divider-vertical" />
                  
                  <ul className="flex flex-col gap-4">
                    {note.timeline.slice(0, 3).map((t) => (
                      <li key={t.id} className="relative flex flex-col gap-0.5">
                        {/* Dot indicator */}
                        <span className="absolute -left-[22px] top-1.5 size-2 bg-accent rounded-sm pixel-corner" />
                        <span className="text-sm font-medium text-foreground">{t.label}</span>
                        <span className="text-xs text-muted-foreground font-medium">{t.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Notes content Reader tab */}
        {activeTab === 'generated-notes' ? (
          <div className="py-1">
            {note.sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/20 p-8 text-center">
                <PixelDocIcon className="mx-auto mb-3 text-muted-foreground/35 size-11" />
                <p className="text-sm text-muted-foreground">
                  This master note has no content yet. Generate it to start reading.
                </p>
              </div>
            ) : (
              <article className="flex flex-col gap-6">
                {note.sections.map((s, idx) => (
                  <section key={s.id} className="flex flex-col gap-2">
                    {idx > 0 && <hr className="pixel-divider mb-4" />}
                    <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                      {s.heading}
                    </h2>
                    <p className="text-sm leading-relaxed text-foreground/80">{s.body}</p>
                  </section>
                ))}
              </article>
            )}
          </div>
        ) : null}

        {/* Sources list tab */}
        {activeTab === 'sources' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                All Sources ({note.sources.length})
              </h2>
            </div>
            {note.sources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/20 p-8 text-center">
                <PixelDocIcon className="mx-auto mb-3 text-muted-foreground/35 size-11" />
                <p className="text-sm text-muted-foreground">No sources added yet.</p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {note.sources.map((s, idx) => (
                  <div key={s.id}>
                    {idx > 0 && <hr className="pixel-divider" />}
                    <li className="flex items-center justify-between py-3.5 touch-highlight-active rounded-lg">
                      <div className="flex items-center gap-2 min-w-0 pr-4">
                        <FileText className="size-[18px] text-muted-foreground/60 shrink-0" />
                        <span className="truncate text-sm text-foreground">{s.name}</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0">{s.pages} pages</span>
                    </li>
                  </div>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {/* Formula sheet tab */}
        {activeTab === 'formula-sheet' ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Formula Sheet</h2>
            <p className="text-xs text-muted-foreground italic py-2">
              No formulas extracted yet. Generate this master note to populate the formula sheet.
            </p>
          </div>
        ) : null}

        {/* Definitions tab */}
        {activeTab === 'definitions' ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Definitions</h2>
            <p className="text-xs text-muted-foreground italic py-2">
              No definitions extracted yet. Generate this master note to populate definitions.
            </p>
          </div>
        ) : null}

        {/* Knowledge Timeline tab */}
        {activeTab === 'knowledge-timeline' ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Knowledge Timeline</h2>
            {note.timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No timeline entries yet.</p>
            ) : (
              <div className="relative pl-6 mt-2">
                {/* Vertical Dotted line accent */}
                <div className="absolute left-[7px] top-1.5 bottom-1.5 pixel-divider-vertical" />
                
                <ul className="flex flex-col gap-5">
                  {note.timeline.map((t) => (
                    <li key={t.id} className="relative flex flex-col gap-0.5">
                      {/* Dot indicator */}
                      <span className="absolute -left-[22px] top-1.5 size-2 bg-accent rounded-sm pixel-corner" />
                      <span className="text-sm font-medium text-foreground">{t.label}</span>
                      <span className="text-xs text-muted-foreground font-medium">{t.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Export tab */}
        {activeTab === 'export' ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Export Workspace</h2>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Download this master note document structured as Markdown (.md).
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleExport}
              disabled={note.sections.length === 0}
              className="w-full h-11 rounded-lg disabled:opacity-50 touch-highlight-active font-semibold"
            >
              <Download className="size-4 mr-1.5" />
              Export Markdown
            </Button>
          </div>
        ) : null}
      </div>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Add Sources">
        <div className="flex flex-col gap-4">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              addFiles(e.dataTransfer.files)
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors',
              dragging ? 'border-accent bg-accent/5' : 'border-border bg-card/40 hover:border-white/10',
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary">
              <UploadCloud className="size-5 text-accent" />
            </span>
            <p className="mt-3 text-xs font-semibold text-foreground">Drop files here or browse</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">PDFs and image scans supported</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 ? (
            <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {files.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 min-w-0"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground/60" />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${name}`}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground touch-highlight-active"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-lg"
              onClick={() => {
                setFiles([])
                setUploadOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={files.length === 0}
              onClick={handleAttach}
              className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 px-4"
            >
              Add {files.length > 0 ? files.length : ''} {files.length === 1 ? 'source' : 'sources'}
            </Button>
          </div>
        </div>
      </Modal>

      {generatingPhase !== -1 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs flex flex-col items-center text-center gap-4">
            <PixelCrabIcon className="size-14 text-accent animate-pulse" />
            <div className="flex flex-col gap-1.5 w-full mt-2">
              <p className="text-sm font-semibold tracking-wide text-foreground">
                {GENERATING_PHASES[generatingPhase].label}
              </p>
              <PixelProgress
                value={GENERATING_PHASES[generatingPhase].progress}
                maxBlocks={10}
                className="justify-center mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
