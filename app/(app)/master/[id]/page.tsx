'use client'

import { useRef, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Download,
  Plus,
  Clock,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  PixelDocIcon,
  PixelCrabIcon,
  PixelPdfIcon,
  PixelMasterNoteIcon,
} from '@/components/pixel-icons'
import { PixelProgress } from '@/components/pixel-progress'
import { EmptyArchive } from '@/components/empty-archive'
import { useMascot } from '@/components/mascot/mascot-context'

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

const COMPILING_PHASES = [
  { label: 'Indexing Sources', progress: 20 },
  { label: 'Reading Documents', progress: 45 },
  { label: 'Comparing Information', progress: 65 },
  { label: 'Building Knowledge Graph', progress: 85 },
  { label: 'Compiling Master Note', progress: 100 },
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

  const [compilingPhase, setCompilingPhase] = useState<number>(-1)
  const { setOverride } = useMascot()
  const isCompiling = compilingPhase !== -1

  useEffect(() => {
    if (isCompiling) {
      setOverride({ category: 'compile', state: 'compiling' })
    } else if (activeTab === 'generated-notes') {
      setOverride({ category: 'reader' })
    } else if (activeTab === 'export') {
      setOverride({ category: 'export' })
    } else {
      setOverride(null)
    }
    return () => setOverride(null)
  }, [isCompiling, activeTab, setOverride])

  function handleCompile() {
    if (!result) return
    if (compilingPhase !== -1) return
    setCompilingPhase(0)

    const interval = setInterval(() => {
      setCompilingPhase((prev) => {
        if (prev >= COMPILING_PHASES.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            generateMasterNote(result.note.id)
            setCompilingPhase(-1)
            setActiveTab('generated-notes')
          }, 600)
          return prev
        }
        return prev + 1
      })
    }, 700)
  }

  if (!result) {
    return (
      <div className="page-shell text-center">
        <p className="text-sm text-muted-foreground">This master note is not in the archive.</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push('/dashboard')}>
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
    <div className="page-shell">
      <button
        type="button"
        onClick={() => router.push(`/vault/${vault.id}`)}
        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-xs font-sans text-muted-foreground transition-colors duration-200 hover:text-foreground touch-highlight-active"
      >
        <ArrowLeft className="size-3.5" />
        {vault.name}
      </button>

      <header className="page-header flex flex-col gap-1">
        <div className="flex items-start gap-2.5">
          <PixelMasterNoteIcon className="size-5 shrink-0 text-accent/60 mt-0.5" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">{note.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {note.generated ? 'Compiled master note' : 'Draft workspace — add sources, then compile'}
        </p>

        <div className="mt-4 flex gap-2">
          <Button size="lg" onClick={handleCompile} className="flex-1">
            Compile Master Note
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setUploadOpen(true)} className="flex-1">
            <Plus className="size-3.5" />
            Add Sources
          </Button>
        </div>
      </header>

      <nav
        aria-label="Workspace tabs"
        className="mt-6 flex gap-0.5 overflow-x-auto scrollbar-none border-b border-border/50 pb-px"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 min-h-10 px-3 py-2 text-xs font-medium transition-colors duration-200 touch-highlight-active',
              activeTab === tab.id
                ? 'text-accent border-b border-accent'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeTab === 'overview' ? (
          <div className="flex flex-col gap-6">
            <div className="py-1">
              <div className="flex items-end justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Coverage
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold tracking-tight text-foreground">{note.coverage}</span>
                  <span className="text-xs text-muted-foreground font-medium">%</span>
                </div>
              </div>
              <PixelProgress value={note.coverage} maxBlocks={12} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                How much of your uploaded material is merged into this note.
              </p>
            </div>

            <hr className="pixel-divider" />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sources · {note.sources.length}
                </h2>
                {note.sources.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('sources')}
                    className="text-xs font-medium text-accent hover:opacity-80 transition-opacity duration-200"
                  >
                    View all
                  </button>
                )}
              </div>
              {note.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">No sources attached yet.</p>
              ) : (
                <ul className="flex flex-col">
                  {note.sources.slice(0, 3).map((s, idx) => (
                    <div key={s.id}>
                      {idx > 0 && <hr className="pixel-divider" />}
                      <li className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2.5 min-w-0 pr-4">
                          <PixelPdfIcon className="size-4 shrink-0" />
                          <span className="truncate text-sm text-foreground">{s.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{s.pages} pg</span>
                      </li>
                    </div>
                  ))}
                </ul>
              )}
            </div>

            <hr className="pixel-divider" />

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Timeline
                </h2>
                {note.timeline.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('knowledge-timeline')}
                    className="text-xs font-medium text-accent hover:opacity-80 transition-opacity duration-200"
                  >
                    View full
                  </button>
                )}
              </div>
              {note.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">No timeline entries yet.</p>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-1.5 bottom-1.5 pixel-divider-vertical" />
                  <ul className="flex flex-col gap-4">
                    {note.timeline.slice(0, 3).map((t) => (
                      <li key={t.id} className="relative flex flex-col gap-0.5">
                        <span className="absolute -left-[22px] top-1.5 size-2 bg-accent pixel-corner" />
                        <span className="text-sm font-medium text-foreground">{t.label}</span>
                        <span className="text-xs text-muted-foreground">{t.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'generated-notes' ? (
          <div className="py-1">
            {note.sections.length === 0 ? (
              <EmptyArchive
                icons={<PixelDocIcon className="size-10" />}
                title="No compiled content yet"
                description="Attach sources, then compile this master note to read merged content here."
              />
            ) : (
              <article className="flex flex-col gap-6">
                {note.sections.map((s, idx) => (
                  <section key={s.id} className="flex flex-col gap-2">
                    {idx > 0 && <hr className="pixel-divider mb-4" />}
                    <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                      {s.heading}
                    </h2>
                    <p className="text-sm leading-relaxed text-foreground/85">{s.body}</p>
                  </section>
                ))}
              </article>
            )}
          </div>
        ) : null}

        {activeTab === 'sources' ? (
          <div>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              All sources · {note.sources.length}
            </h2>
            {note.sources.length === 0 ? (
              <EmptyArchive
                icons={
                  <>
                    <PixelPdfIcon className="size-9" />
                    <PixelDocIcon className="size-9 text-accent/50" />
                  </>
                }
                title="No sources yet"
                description="Add PDFs or handwritten scans to begin compiling."
                action={
                  <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                    <Plus className="size-3.5" />
                    Add Sources
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col">
                {note.sources.map((s, idx) => (
                  <div key={s.id}>
                    {idx > 0 && <hr className="pixel-divider" />}
                    <li className="list-row touch-highlight-active">
                      <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <PixelPdfIcon className="size-4 shrink-0" />
                        <span className="truncate text-sm text-foreground">{s.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{s.pages} pg</span>
                    </li>
                  </div>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activeTab === 'formula-sheet' ? (
          <EmptyArchive
            icons={<PixelDocIcon className="size-9" />}
            title="Formula sheet empty"
            description="Compile this master note to extract formulas from your sources."
          />
        ) : null}

        {activeTab === 'definitions' ? (
          <EmptyArchive
            icons={<PixelDocIcon className="size-9" />}
            title="No definitions yet"
            description="Compile this master note to pull out key terms and definitions."
          />
        ) : null}

        {activeTab === 'knowledge-timeline' ? (
          <div>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Knowledge timeline
            </h2>
            {note.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No timeline entries yet.</p>
            ) : (
              <div className="relative pl-6 mt-1">
                <div className="absolute left-[7px] top-1.5 bottom-1.5 pixel-divider-vertical" />
                <ul className="flex flex-col gap-5">
                  {note.timeline.map((t) => (
                    <li key={t.id} className="relative flex flex-col gap-0.5">
                      <span className="absolute -left-[22px] top-1.5 size-2 bg-accent pixel-corner" />
                      <span className="text-sm font-medium text-foreground">{t.label}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {t.date}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'export' ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Export
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Download this master note as a Markdown file.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleExport}
              disabled={note.sections.length === 0}
              className="w-full"
            >
              <Download className="size-3.5" />
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
              'flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[3px] border border-dashed p-6 text-center transition-colors duration-200',
              dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-white/10',
            )}
          >
            <UploadCloud className="size-6 text-accent" />
            <p className="text-sm font-medium text-foreground">Drop files or browse</p>
            <p className="mt-1 text-xs text-muted-foreground">PDFs and image scans</p>
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
            <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {files.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="flex min-h-10 items-center gap-2 px-1 min-w-0"
                >
                  <PixelPdfIcon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${name}`}
                    className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground touch-highlight-active"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiles([])
                setUploadOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button disabled={files.length === 0} size="sm" onClick={handleAttach}>
              Attach {files.length > 0 ? files.length : ''}{' '}
              {files.length === 1 ? 'source' : 'sources'}
            </Button>
          </div>
        </div>
      </Modal>

      {compilingPhase !== -1 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/96 px-6 animate-slide-fade">
          <div className="w-full max-w-sm flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3">
              <PixelCrabIcon state="compiling" className="size-[64px] text-accent" />
              <p className="font-brand text-xs text-muted-foreground uppercase tracking-wider">
                Indexing sources
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {COMPILING_PHASES.map((phase, idx) => (
                <div
                  key={phase.label}
                  className={cn(
                    'flex items-center justify-between text-sm transition-opacity duration-200',
                    idx <= compilingPhase ? 'text-foreground' : 'text-muted-foreground/30',
                  )}
                >
                  <span>{phase.label}</span>
                  {idx <= compilingPhase && (
                    <PixelProgress value={phase.progress} maxBlocks={10} className="text-[11px]" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-center font-brand text-[10px] text-muted-foreground/60">
              build 0.1.0 · pdf-crab
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
