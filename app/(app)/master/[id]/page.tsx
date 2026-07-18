'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useVaults } from '@/lib/vault-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { KebabMenu } from '@/components/ui/kebab-menu'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Download,
  Plus,
  Clock,
  UploadCloud,
  X,
  Search,
  FileText,
  Sigma,
  BookOpen,
  GitBranch,
  Layers,
  Eye,
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
import { PixelProgressRing } from '@/components/pixel-progress'
import { Reveal } from '@/components/reveal'
import { renderMarkdown } from '@/lib/markdown'


const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'generated-notes', label: 'Notes', icon: FileText },
  { id: 'sources', label: 'Sources', icon: UploadCloud },
  { id: 'formula-sheet', label: 'Formulas', icon: Sigma },
  { id: 'definitions', label: 'Definitions', icon: BookOpen },
  { id: 'knowledge-timeline', label: 'Timeline', icon: GitBranch },
  { id: 'export', label: 'Export', icon: Download },
] as const

type TabId = (typeof TABS)[number]['id']

const COMPILING_PHASES = [
  { label: 'Indexing Sources', progress: 20 },
  { label: 'Reading Documents', progress: 45 },
  { label: 'Comparing Information', progress: 65 },
  { label: 'Building Knowledge Graph', progress: 85 },
  { label: 'Compiling Master Note', progress: 100 },
] as const

const TIMELINE_STEPS = [
  { key: 'Indexing Sources', label: 'Indexing Sources', description: 'Cataloging vault files and calculating checksums' },
  { key: 'Reading Documents', label: 'Reading Documents & OCR', description: 'Running OCR and layout classification' },
  { key: 'Comparing Information', label: 'Extracting Knowledge Graph', description: 'Extracting formulas, topics, and structures' },
  { key: 'Building Knowledge Graph', label: 'Building Pedagogical Graph', description: 'Resolving dependency order and merging duplicates' },
  { key: 'Compiling Master Note', label: 'Composing Digital Notebook', description: 'Running quality checks and typesetting clean markdown' },
] as const

export default function MasterNotePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { getMasterNote, generateMasterNote, fetchVaults, deleteDocument, renameDocument } = useVaults()
  const result = getMasterNote(params.id)

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [replacingDocId, setReplacingDocId] = useState<string | null>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const handleTriggerReplace = (docId: string) => {
    setReplacingDocId(docId)
    if (replaceInputRef.current) {
      replaceInputRef.current.value = ''
      replaceInputRef.current.click()
    }
  }

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingDocId || !result) return

    try {
      console.log('[replaceFile] Deleting old source document:', replacingDocId)
      await deleteDocument(replacingDocId)

      console.log('[replaceFile] Uploading replacement file:', file.name)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vaultId', result.vault.id)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Upload failed')
      }

      console.log('[replaceFile] Replacement upload successful, syncing store...')
      await fetchVaults()
    } catch (err: any) {
      console.error('Failed to replace file:', err)
      alert(`Error replacing file:\n${err.message || err}`)
    } finally {
      setReplacingDocId(null)
    }
  }

  const [compilingPhase, setCompilingPhase] = useState<number>(-1)
  const [isPolling, setIsPolling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)
  const { setOverride } = useMascot()
  const isCompiling = compilingPhase !== -1 || isPolling

  const supabase = createClient()

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

  useEffect(() => {
    if (!result) return
    async function checkActiveJob() {
      const { data } = await supabase
        .from('compile_jobs')
        .select('status, phase')
        .eq('master_note_id', result!.note.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data && (data.status === 'queued' || data.status === 'processing')) {
        const idx = COMPILING_PHASES.findIndex((p) => p.label === data.phase)
        setCompilingPhase(idx !== -1 ? idx : 0)
        setIsPolling(true)
      }
    }
    checkActiveJob()
  }, [result, supabase])

  useEffect(() => {
    if (!isPolling || !result) return

    const intervalId = setInterval(async () => {
      const { data, error } = await supabase
        .from('compile_jobs')
        .select('status, phase, error_message')
        .eq('master_note_id', result.note.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error polling compile job:', error)
        return
      }

      if (!data) {
        setIsPolling(false)
        setCompilingPhase(-1)
        return
      }

      if (data.status === 'completed') {
        clearInterval(intervalId)
        setIsPolling(false)
        setCompilingPhase(-1)
        setCompileError(null)
        await fetchVaults()
        setActiveTab('generated-notes')
      } else if (data.status === 'failed') {
        clearInterval(intervalId)
        setIsPolling(false)
        setCompilingPhase(-1)
        setCompileError(data.error_message || 'Compilation failed')
      } else {
        const idx = COMPILING_PHASES.findIndex((p) => p.label === data.phase)
        setCompilingPhase(idx !== -1 ? idx : 0)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isPolling, result, supabase, fetchVaults])

  async function handleCompile() {
    if (!result) return
    if (isCompiling) return

    try {
      setCompilingPhase(0)
      setCompileError(null)
      await generateMasterNote(result.note.id)
      setIsPolling(true)
    } catch (err: any) {
      setCompileError(err.message || 'Could not compile')
      setCompilingPhase(-1)
    }
  }

  if (!result) {
    return (
      <div className="page-shell text-center">
        <p className="text-sm text-muted-foreground">This master note is not in the archive.</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="size-3.5" />
          Back to Vaults
        </Button>
      </div>
    )
  }

  const { note, vault } = result

  function addFiles(list: FileList | null) {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list)])
  }

  async function handleAttach() {
    if (files.length === 0) return

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vaultId', vault.id)
      formData.append('masterNoteId', note.id)

      let res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 409) {
        const data = await res.json()
        const reuse = confirm(
          `${data.message || 'File already exists.'}\nWould you like to reuse the existing document?`
        )
        if (reuse) {
          res = await fetch(`/api/upload?reuse=true`, {
            method: 'POST',
            body: formData,
          })
        } else {
          continue
        }
      }

      if (!res.ok) {
        const err = await res.json()
        alert(`Upload failed for ${file.name}: ${err.message || 'Unknown error'}`)
      }
    }

    setFiles([])
    setUploadOpen(false)
    await fetchVaults()
    setActiveTab('sources')
  }

  function triggerExport(format: 'markdown' | 'pdf' | 'docx') {
    window.open(`/api/export?id=${note.id}&format=${format}`, '_blank')
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
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <PixelMasterNoteIcon className="size-5 shrink-0 text-accent/60 mt-0.5" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">{note.title}</h1>
          </div>
          <div className="shrink-0">
            {isCompiling ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 animate-pulse border border-blue-200">
                <svg className="animate-spin size-3 text-blue-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Compiling...
              </span>
            ) : compileError ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                Compilation Failed
              </span>
            ) : note.generated ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <svg className="size-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Compiled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                Draft
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {isCompiling 
            ? `Compiling note contents... ${COMPILING_PHASES[compilingPhase]?.label ? `(${COMPILING_PHASES[compilingPhase].label})` : ''}`
            : compileError 
              ? `Error: ${compileError}` 
              : note.generated 
                ? 'Compiled master note' 
                : 'Draft workspace — add sources, then compile'}
        </p>

        <div className="mt-4 flex gap-2">
          <Button 
            size="lg" 
            onClick={handleCompile} 
            disabled={isCompiling} 
            className="flex-1"
          >
            {isCompiling ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 size-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Compiling...
              </span>
            ) : (
              <>
                <PixelMasterNoteIcon className="size-3.5" />
                {compileError ? 'Retry Compilation' : 'Compile Master Note'}
              </>
            )}
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => setUploadOpen(true)} 
            disabled={isCompiling} 
            className="flex-1"
          >
            <Plus className="size-3.5" />
            Add Sources
          </Button>
        </div>
      </header>

      { (isCompiling || compileError) && (
        <div className="mt-6 border border-border bg-card/30 p-5 rounded-lg flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Compilation Pipeline Progress
          </h3>
          <div className="relative border-l border-border pl-6 ml-3 flex flex-col gap-6">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = idx < compilingPhase && compilingPhase !== -1
              const isActive = idx === compilingPhase && isCompiling
              const isFailed = idx === compilingPhase && !!compileError
              const isFuture = idx > compilingPhase || compilingPhase === -1

              let icon = null
              if (isCompleted) {
                icon = (
                  <span className="absolute -left-[37px] size-6 bg-green-500 rounded-full flex items-center justify-center border-4 border-background">
                    <svg className="size-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )
              } else if (isActive) {
                icon = (
                  <span className="absolute -left-[37px] size-6 bg-blue-500 rounded-full flex items-center justify-center border-4 border-background animate-pulse">
                    <svg className="animate-spin size-3 text-white" fill="none" viewBox="0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                )
              } else if (isFailed) {
                icon = (
                  <span className="absolute -left-[37px] size-6 bg-red-500 rounded-full flex items-center justify-center border-4 border-background">
                    <span className="text-white text-xs font-bold font-sans">!</span>
                  </span>
                )
              } else {
                icon = (
                  <span className="absolute -left-[37px] size-6 bg-muted/30 rounded-full flex items-center justify-center border-4 border-background" />
                )
              }

              return (
                <div key={step.key} className="relative flex flex-col gap-0.5 pl-2">
                  {icon}
                  <span className={cn(
                    "text-xs font-semibold",
                    isActive ? "text-blue-600 dark:text-blue-400" : isFailed ? "text-red-600 dark:text-red-400" : isCompleted ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {step.description}
                  </span>
                </div>
              )
            })}
          </div>
          {compileError && (
            <div className="mt-2 text-[11px] font-mono text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-100 dark:border-red-950/40">
              Error details: {compileError}
            </div>
          )}
        </div>
      )}

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
              'shrink-0 min-h-10 px-3 py-2 text-xs font-medium transition-colors duration-200 touch-highlight-active flex items-center gap-1.5',
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <Reveal className="flex flex-col gap-6">
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
              <PixelProgress value={note.coverage} maxBlocks={12} className="mt-3" showLabel label="Coverage" />
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
          </Reveal>
        )}

        {activeTab === 'generated-notes' && (
          <Reveal className="py-1">
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
                    <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
                      {renderMarkdown(s.body)}
                    </div>
                  </section>
                ))}
              </article>
            )}
          </Reveal>
        )}

        {activeTab === 'sources' && (
          <Reveal>
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
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{s.pages} pg</span>
                          <KebabMenu
                            items={[
                              {
                                label: 'Rename',
                                onSelect: () => {
                                  const newName = prompt('Enter new name for the document:', s.name)
                                  if (newName && newName.trim() && newName !== s.name) {
                                    renameDocument(s.id, newName.trim()).catch((err) => {
                                      alert(`Failed to rename document: ${err.message}`)
                                    })
                                  }
                                },
                              },
                              {
                                label: 'Replace',
                                onSelect: () => handleTriggerReplace(s.id),
                              },
                              {
                                label: 'Delete',
                                destructive: true,
                                onSelect: () => {
                                  if (
                                    confirm(
                                      'Are you sure you want to delete this source? This will remove it from the vault and exclude it from future compilations.'
                                    )
                                  ) {
                                    deleteDocument(s.id).catch((err) => {
                                      alert(`Failed to delete document: ${err.message}`)
                                    })
                                  }
                                },
                              },
                            ]}
                          />
                        </div>
                      </li>
                    </div>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        )}

        {activeTab === 'formula-sheet' && (
          <Reveal>
            <EmptyArchive
              icons={<PixelDocIcon className="size-9" />}
              title="Formula sheet empty"
              description="Compile this master note to extract formulas from your sources."
            />
          </Reveal>
        )}

        {activeTab === 'definitions' && (
          <Reveal>
            <EmptyArchive
              icons={<PixelDocIcon className="size-9" />}
              title="No definitions yet"
              description="Compile this master note to pull out key terms and definitions."
            />
          </Reveal>
        )}

        {activeTab === 'knowledge-timeline' && (
          <Reveal>
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
          </Reveal>
        )}

        {activeTab === 'export' && (
          <Reveal className="flex flex-col gap-4">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Export Master Note
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Download this master note in your preferred format.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => triggerExport('markdown')}
                disabled={note.sections.length === 0}
                className="w-full justify-start gap-3"
              >
                <Download className="size-3.5" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Export Markdown (.md)</div>
                  <div className="text-xs text-muted-foreground">Plain text with markdown formatting</div>
                </div>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => triggerExport('pdf')}
                disabled={note.sections.length === 0}
                className="w-full justify-start gap-3"
              >
                <Download className="size-3.5" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Export PDF (.pdf)</div>
                  <div className="text-xs text-muted-foreground">Formatted document ready to print</div>
                </div>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => triggerExport('docx')}
                disabled={note.sections.length === 0}
                className="w-full justify-start gap-3"
              >
                <Download className="size-3.5" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Export Word Document (.docx)</div>
                  <div className="text-xs text-muted-foreground">Editable Microsoft Word format</div>
                </div>
              </Button>
            </div>
          </Reveal>
        )}
      </div>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Add Sources" description="Drop PDFs or image scans to attach as source documents.">
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
              'flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed p-6 text-center transition-colors duration-200',
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
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex min-h-10 items-center gap-2 px-1 min-w-0"
                >
                  <PixelPdfIcon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${file.name}`}
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
                Compiling knowledge...
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
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFileChange}
        accept="application/pdf"
        className="hidden"
      />
    </div>
  )
}