'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink, GitBranch, Download, FileText, Search, Zap, Eye, Layers, Check, Circle, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { PixelCrabIcon } from '@/components/pixel-icons'
import { PixelFolderIcon, PixelDocIcon, PixelMasterNoteIcon, PixelPdfIcon } from '@/components/pixel-icons'

const STORY_BEATS: readonly {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly crabState: 'curious' | 'searching' | 'compiling' | 'happy' | 'default';
  readonly crabPose: 'A' | 'B' | 'C' | 'D';
  readonly progress: number;
}[] = [
  {
    id: 'drop',
    title: 'Drop your sources',
    subtitle: 'PDFs, scans, photos of handwritten notes — drag them in.',
    crabState: 'searching',
    crabPose: 'B',
    progress: 0,
  },
  {
    id: 'wake',
    title: 'The crab wakes up',
    subtitle: 'It reads every page. Every diagram. Every formula.',
    crabState: 'searching',
    crabPose: 'C',
    progress: 15,
  },
  {
    id: 'ocr',
    title: 'OCR extracts everything',
    subtitle: 'Mistral OCR pulls text, tables, structures — nothing lost.',
    crabState: 'searching',
    crabPose: 'C',
    progress: 30,
  },
  {
    id: 'duplicates',
    title: 'Duplicates glow amber',
    subtitle: 'Semantic duplicates detected. Only true copies removed.',
    crabState: 'compiling',
    crabPose: 'A',
    progress: 45,
  },
  {
    id: 'assemble',
    title: 'Master note assembles',
    subtitle: 'Sections merge. Complementary knowledge aligned. One coherent narrative.',
    crabState: 'compiling',
    crabPose: 'A',
    progress: 65,
  },
  {
    id: 'citations',
    title: 'Every claim traced',
    subtitle: 'Click any sentence → jump to source page. Zero hallucinations.',
    crabState: 'default',
    crabPose: 'D',
    progress: 80,
  },
  {
    id: 'export',
    title: 'Export anywhere',
    subtitle: 'Markdown, PDF, DOCX. Version saved. History intact.',
    crabState: 'compiling',
    crabPose: 'A',
    progress: 100,
  },
] as const satisfies ReadonlyArray<{
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly crabState: 'default' | 'searching' | 'compiling' | 'deleting'
  readonly crabPose: 'A' | 'B' | 'C' | 'D'
  readonly progress: number
}>

const SOURCES = [
  { name: 'Lecture 04 — Alkenes', pages: 12, type: 'pdf' },
  { name: 'Tutorial Notes — Week 3', pages: 8, type: 'pdf' },
  { name: 'Handwritten — Mechanisms', pages: 5, type: 'image' },
  { name: 'Textbook Ch. 7 — Reactions', pages: 22, type: 'pdf' },
]

const TIMELINE = [
  { label: 'Nomenclature', done: true },
  { label: 'Addition Reactions', done: true },
  { label: "Markovnikov's Rule", done: true },
  { label: 'Reaction Mechanisms', done: false },
  { label: 'Stereochemistry', done: false },
  { label: 'Synthesis Planning', done: false },
]

export default function Page() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [crabScale, setCrabScale] = useState(1)
  const [showThought, setShowThought] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  const storyContainerRef = useRef<HTMLDivElement>(null)
  const crabRef = useRef<HTMLDivElement>(null)
  const storyBeatsRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<(HTMLDivElement | null)[]>([])
  const stickyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'auto'
    setIsReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!storyBeatsRef.current) return
      const rect = storyBeatsRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const totalScroll = rect.height - viewportHeight
      const scrolled = -rect.top
      const progress = Math.max(0, Math.min(1, scrolled / totalScroll))
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!crabRef.current) return
      const rect = crabRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setMousePos({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Calculate active beat for progress dots only (based on scroll milestones)
  const beatProgressValues = STORY_BEATS.map(b => b.progress / 100)
  let activeBeatForDots = 0
  for (let i = 0; i < beatProgressValues.length; i++) {
    const enter = i === 0 ? 0 : beatProgressValues[i - 1]
    const exit = i === beatProgressValues.length - 1 ? 1 : beatProgressValues[i]
    if (scrollProgress >= enter && scrollProgress <= exit) {
      activeBeatForDots = i
      break
    }
  }

  const currentBeat = STORY_BEATS[activeBeatForDots]
  const crabThoughts = [
    'Reading your chaos...',
    'Found a duplicate!',
    'Preserving that formula...',
    'Linking sources...',
    'Ready to compile.',
  ]
  const currentThought = crabThoughts[Math.floor(scrollProgress * 100 / 20) % crabThoughts.length]

  // Map story beat states to valid PixelCrabIcon states
  const getCrabState = (storyState: string) => {
    switch (storyState) {
      case 'curious': return 'searching'
      case 'searching': return 'searching'
      case 'compiling': return 'compiling'
      case 'happy': return 'compiling'
      case 'default': return 'default'
      default: return 'default'
    }
  }
  const crabState = getCrabState(currentBeat.crabState)

  const handleCrabHover = useCallback(() => {
    setShowThought(true)
    setTimeout(() => setShowThought(false), 3000)
    setCrabScale(1.05)
  }, [])

  const handleCrabLeave = useCallback(() => {
    setCrabScale(1)
  }, [])

  const registerBeatRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    beatRefs.current[index] = el
  }, [])

  if (isReducedMotion) {
    return (
      <main className="relative min-h-screen flex flex-col">
        <ReducedMotionStory />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen flex flex-col">
      
      {/* Progress indicator - top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background pointer-events-none" aria-hidden="true">
        <div 
          className="h-full bg-gradient-to-r from-accent to-accent-coral origin-left transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${scrollProgress})` }}
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Story progress"
        />
      </div>

      {/* Sticky crab guide - left side on desktop, bottom on mobile */}
      <div 
        ref={crabRef}
        className={cn(
          'fixed z-40 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'lg:left-6 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:translate-y-0',
          'bottom-6 left-1/2 -translate-x-1/2 lg:bottom-auto lg:left-6 lg:-translate-x-0'
        )}
        style={{
          transform: `translateX(-50%) translateY(0) translateX(${(mousePos.x - 0.5) * 20}px) translateY(${(-50 + (mousePos.y - 0.5) * 15)}%) scale(${crabScale})`,
        }}
        onMouseEnter={handleCrabHover}
        onMouseLeave={handleCrabLeave}
        onClick={() => { setShowThought(true); setTimeout(() => setShowThought(false), 2000) }}
      >
        <div className="flex flex-col items-center gap-2 lg:flex-row lg:items-center lg:gap-3">
          <PixelCrabIcon 
            className={cn(
              'size-12 lg:size-16 text-accent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              crabState === 'searching' && currentBeat.crabState === 'curious' && 'rotate-[-8deg]',
              crabState === 'searching' && currentBeat.crabState === 'searching' && 'rotate-[8deg]',
              crabState === 'compiling' && 'animate-pulse-soft',
              crabState === 'compiling' && currentBeat.crabState === 'happy' && 'scale-110'
            )}
            state={crabState}
            pose={currentBeat.crabPose}
          />
          {showThought && (
            <div className="absolute left-full ml-4 w-max px-3 py-1.5 bg-card border border-border/50 rounded-[6px] shadow-xl animate-scale-in font-brand text-xs text-muted-foreground whitespace-nowrap lg:absolute lg:left-full lg:top-1/2 lg:-translate-y-1/2 lg:ml-4">
              {currentThought}
              <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 size-0 border-3 border-transparent border-r-card" />
            </div>
          )}
        </div>
      </div>

      {/* Main story container */}
      <div 
        ref={storyContainerRef}
        className="relative flex-1 lg:pl-32 min-h-[100dvh] pb-safe overflow-x-hidden"
        role="main"
        aria-label="PDF-Crab story"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Hero / Entry */}
        <section className="relative min-h-[100dvh] flex items-center justify-center px-4 py-20 lg:py-0 safe-top" aria-labelledby="story-title" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="mx-auto max-w-4xl w-full">
            <div className="text-center mb-16 lg:mb-0">
              <PixelCrabIcon className="size-12 mx-auto mb-6 text-accent" state="default" />
              <h1 id="story-title" className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground leading-[1.05] text-balance">
                Scattered notes.
                <br />
                <span className="text-accent">One master note.</span>
              </h1>
              <p className="mt-6 mx-auto max-w-2xl text-lg md:text-xl leading-relaxed text-muted-foreground text-pretty">
                Upload PDFs and handwritten scans. PDF-Crab merges them into a single compiled note —
                same wording preserved, duplicates removed, diagrams intact.
              </p>
            </div>

            {/* CTA - inline in hero */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto px-10 gap-3 group">
                  <span>Open the Archive</span>
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Scroll hint */}
            <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground/50 font-brand text-[10px] uppercase tracking-wider animate-float">
              <span>Scroll to watch it work</span>
              <div className="flex flex-col items-center gap-1">
                <span className="size-1.5 rounded-full bg-accent/50 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 rounded-full bg-accent/50 animate-pulse-soft" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 rounded-full bg-accent/50 animate-pulse-soft" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </section>

{/* Story beats - each fills viewport */}
        <div ref={storyBeatsRef} className="relative" style={{ height: `${STORY_BEATS.length * 100}dvh` }}>
          {STORY_BEATS.map((beat, index) => (
            <StoryBeat
              key={beat.id}
              beat={beat}
              index={index}
              scrollProgress={scrollProgress}
              activeBeatForDots={activeBeatForDots}
              registerRef={registerBeatRef}
              mousePos={mousePos}
            />
          ))}
        </div>

        {/* Final CTA section */}
        <section className="relative min-h-[100dvh] flex items-center justify-center px-4 py-20 safe-bottom" aria-labelledby="final-cta" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-2xl w-full text-center">
            <PixelCrabIcon className="size-16 mx-auto mb-6 text-accent" state="compiling" />
            <h2 id="final-cta" className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
              Ready to compile your first master note?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join students who refuse to lose information.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto px-10 gap-3 group">
                  <span>Start Compiling</span>
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full sm:w-auto px-10 gap-3"
                onClick={() => document.getElementById('story-title')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <GitBranch className="size-5" />
                Watch Again
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-border/30 py-12 px-4 safe-bottom" style={{ paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))' }}>
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-3">
                <PixelCrabIcon className="size-8 text-accent" state="default" />
                <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  PDF<span className="text-accent">-</span>Crab
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Knowledge Compiler for students who refuse to lose information.
                Built with Next.js, Supabase, Mistral OCR, and Groq.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/60">
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <GitBranch className="size-3.5" />
                  GitHub
                </Link>
                <span className="text-muted-foreground/40">·</span>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <span className="text-muted-foreground/40">·</span>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              </div>
              <p className="font-brand text-[10px] text-muted-foreground/50">
                © {new Date().getFullYear()} PDF-Crab · build 0.1.0
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

/* ==================== Story Beat Component ==================== */

function StoryBeat({ 
  beat, 
  index, 
  scrollProgress, 
  activeBeatForDots,
  registerRef,
  mousePos,
}: { 
  beat: typeof STORY_BEATS[0]; 
  index: number; 
  scrollProgress: number;
  activeBeatForDots: number;
  registerRef: (index: number) => (el: HTMLDivElement | null) => void;
  mousePos: { x: number; y: number };
}) {
  const totalBeats = STORY_BEATS.length
  const beatProgressValues = STORY_BEATS.map(b => b.progress / 100)
  
  // Fixed reveal window aligned to beat progress milestones
  // Beat i reveals from previous beat's milestone to its own milestone
  const revealEnter = index === 0 ? 0 : beatProgressValues[index - 1]
  const revealExit = beatProgressValues[index]
  
  // For last beat, extend to end of scroll
  const actualExit = index === totalBeats - 1 ? 1 : revealExit
  
  // Reveal progress based purely on scroll position within this beat's fixed window
  // Independent of activeBeat - this fixes the boundary flicker
  const revealProgress = Math.max(0, Math.min(1, (scrollProgress - revealEnter) / (actualExit - revealEnter)))
  
  // State: future=0, current=revealProgress, completed=1
  const isCompleted = scrollProgress >= actualExit
  const isCurrent = !isCompleted && scrollProgress >= revealEnter
  const opacity = isCompleted ? 1 : isCurrent ? revealProgress : 0
  const scale = isCompleted ? 1 : isCurrent ? (0.98 + revealProgress * 0.02) : 0.98
  const translateY = isCompleted ? 0 : isCurrent ? 20 * (1 - revealProgress) : 20

  const parallaxX = (mousePos.x - 0.5) * 30
  const parallaxY = (mousePos.y - 0.5) * 20

return (
    <div
      ref={registerRef(index)}
      className="absolute left-0 right-0 w-full"
      style={{ top: `${index * 100}dvh`, height: '100dvh' }}
      aria-labelledby={`beat-${beat.id}-title`}
    >
      {/* Beat background atmosphere */}
      <div 
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ 
          opacity: opacity,
          background: `radial-gradient(ellipse at ${50 + (mousePos.x - 0.5) * 40}% ${50 + (mousePos.y - 0.5) * 30}%, rgba(255,140,60,0.03) 0%, transparent 70%)`
        }}
      />

      {/* Sticky content area */}
      <div className="relative h-full flex items-center justify-center px-4">
        <div className="mx-auto max-w-5xl w-full">
          {/* Beat number + title */}
          <div 
            className="text-center mb-8"
            style={{ opacity, transform: `translateY(${translateY}px)` }}
          >
            <span className="font-brand text-xs uppercase tracking-widest text-accent/80">
              Step {index + 1} of {STORY_BEATS.length}
            </span>
            <h2 id={`beat-${beat.id}-title`} className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.1] text-balance">
              {beat.title}
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {beat.subtitle}
            </p>
          </div>

          {/* Visual demonstration area */}
          <div 
            className="relative"
            style={{ 
              transform: `translate(${parallaxX}px, ${parallaxY}px) scale(${scale})`,
              opacity,
            }}
          >
            {index === 0 && <DropVisual />}
            {index === 1 && <WakeVisual />}
            {index === 2 && <OCRVisual />}
            {index === 3 && <DuplicatesVisual />}
            {index === 4 && <AssembleVisual />}
            {index === 5 && <CitationsVisual />}
            {index === 6 && <ExportVisual />}
          </div>

          {/* Progress dots */}
          <div className="mt-12 flex items-center justify-center gap-3 safe-bottom pb-6" role="navigation" aria-label="Story progress">
            {STORY_BEATS.map((b, i) => (
              <button
                key={b.id}
                className={cn(
                  'size-11 rounded-full transition-all duration-300 touch-target flex items-center justify-center',
                  i === activeBeatForDots ? 'bg-accent scale-110' : 'bg-border/50 hover:bg-accent/50'
                )}
                onClick={() => {
                  const targetProgress = b.progress / 100
                  const targetY = targetProgress * (STORY_BEATS.length * 100 - 100) * (window.innerHeight / 100)
                  window.scrollTo({ top: targetY, behavior: 'smooth' })
                }}
                aria-label={`Go to step ${i + 1}: ${b.title}`}
                aria-current={i === activeBeatForDots ? 'step' : undefined}
              >
                <span className={cn(
                  'size-2 rounded-full transition-all duration-300',
                  i === activeBeatForDots ? 'bg-accent-foreground' : 'bg-transparent'
                )} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== Beat Visuals ==================== */

function DropVisual() {
  return (
    <div className="relative aspect-square max-w-xl mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[16px] bg-gradient-to-br from-accent/10 to-primary/10 border border-border/50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,140,60,0.05)_50%)] bg-[size:12px_12px] animate-[shimmer_3s_linear_infinite]" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
          <div className="flex size-24 items-center justify-center rounded-full bg-accent/10 text-accent">
            <PixelFolderIcon className="size-12" />
          </div>
          <span className="font-brand text-xs text-muted-foreground uppercase tracking-wider">Drag sources here</span>
          <div className="flex gap-2">
            <span className="px-3 py-1 text-[10px] font-brand rounded bg-accent/10 text-accent">PDF</span>
            <span className="px-3 py-1 text-[10px] font-brand rounded bg-accent/10 text-accent">PNG</span>
            <span className="px-3 py-1 text-[10px] font-brand rounded bg-accent/10 text-accent">JPG</span>
          </div>
        </div>
        {/* Floating source cards */}
        <div className="absolute -top-4 -right-4 opacity-60 pointer-events-none">
          <div className="flex size-16 items-center justify-center rounded-[8px] bg-card border border-border/50 shadow-lg">
            <PixelPdfIcon className="size-6 text-accent/70" />
          </div>
        </div>
        <div className="absolute bottom-4 -left-4 opacity-60 pointer-events-none">
          <div className="flex size-16 items-center justify-center rounded-[8px] bg-card border border-border/50 shadow-lg">
            <PixelDocIcon className="size-6 text-accent/70" />
          </div>
        </div>
      </div>
    </div>
  )
}

function WakeVisual() {
  return (
    <div className="relative aspect-square max-w-xl mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[16px] bg-card border border-border/50 flex items-center justify-center">
        <PixelCrabIcon className="size-20 text-accent" state="searching" pose="B" />
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent/10 text-accent text-xs font-brand rounded-full animate-pulse-soft">
          Waking up...
        </div>
      </div>
      {/* Ripple effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 rounded-[16px] border-2 border-accent/30 animate-[pulse_2s_ease-out_infinite]" />
        <div className="absolute inset-4 rounded-[16px] border-2 border-accent/10 animate-[pulse_2s_ease-out_infinite] delay-500" />
      </div>
    </div>
  )
}

function OCRVisual() {
  const [phase, setPhase] = useState(0)
  const phases = ['Detecting text regions...', 'Extracting characters...', 'Reading tables...', 'Parsing formulas...', 'Structuring output...']

  useEffect(() => {
    const interval = setInterval(() => setPhase(p => (p + 1) % phases.length), 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative aspect-square max-w-xl mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[16px] bg-card border border-border/50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-secondary/30">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-accent-gold/60" />
            <span className="size-3 rounded-full bg-accent-green/60" />
          </div>
          <span className="ml-3 font-brand text-[10px] text-muted-foreground tracking-wide uppercase">OCR Pipeline</span>
        </div>
        <div className="p-6 space-y-4">
          <PixelCrabIcon className="size-12 text-accent mx-auto" state="searching" pose="C" />
          <div className="text-center">
            <p className="font-brand text-sm text-foreground">{phases[phase]}</p>
            <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full animate-shimmer" style={{ width: `${((phase + 1) / phases.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex gap-1 justify-center text-[10px] font-brand text-muted-foreground">
            {phases.map((_, i) => (
              <span key={i} className={cn('px-2 py-0.5 rounded', i <= phase ? 'bg-accent/20 text-accent' : 'bg-secondary/50')}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DuplicatesVisual() {
  return (
    <div className="relative aspect-square max-w-xl mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[16px] bg-card border border-border/50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-secondary/30">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-accent-gold/60" />
            <span className="size-3 rounded-full bg-accent-green/60" />
          </div>
          <span className="ml-3 font-brand text-[10px] text-muted-foreground tracking-wide uppercase">Duplicate Detection</span>
        </div>
        <div className="p-6 space-y-3">
          <PixelCrabIcon className="size-10 text-accent mx-auto" state="compiling" />
          <div className="space-y-2">
            {[
              { text: 'Markovnikov rule — Source A', match: true },
              { text: 'Markovnikov rule — Source B', match: true },
              { text: 'Carbocation stability — Source A', match: false },
              { text: 'Carbocation stability — Source C', match: false },
              { text: 'Anti addition mechanism — Source B', match: true },
              { text: 'Anti addition mechanism — Source C', match: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-[6px] bg-secondary/50 border border-border/50 transition-colors" style={{ borderColor: item.match ? 'rgba(255,140,60,0.5)' : 'transparent' }}>
                <span className={cn('size-2 rounded-[2px] shrink-0', item.match ? 'bg-accent animate-pulse-soft' : 'bg-muted-foreground/30')} />
                <span className={cn('text-sm font-brand flex-1 truncate', item.match ? 'text-accent' : 'text-foreground')}>{item.text}</span>
                {item.match && <span className="text-xs font-brand text-accent/70">MERGED</span>}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="font-brand text-xs text-muted-foreground">23 duplicates removed · 0 information lost</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssembleVisual() {
  return (
    <div className="relative aspect-square max-w-xl mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[16px] bg-card border border-border/50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-secondary/30">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-accent-gold/60" />
            <span className="size-3 rounded-full bg-accent-green/60" />
          </div>
          <span className="ml-3 font-brand text-[10px] text-muted-foreground tracking-wide uppercase">Master Note v1</span>
        </div>
        <div className="p-6 space-y-4 max-h-[70%] overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <PixelMasterNoteIcon className="size-6 text-accent/70" />
            <div>
              <span className="font-semibold text-foreground">Alkenes — Compiled Master Note</span>
              <div className="mt-1 flex gap-2 text-[11px] text-muted-foreground font-brand">
                <span>94% coverage</span>
                <span className="text-muted-foreground/40">·</span>
                <span>4 sources</span>
                <span className="text-muted-foreground/40">·</span>
                <span>47 pages</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-semibold text-foreground">Nomenclature & Structure</p>
            <p className="text-muted-foreground">Alkenes are hydrocarbons containing at least one carbon-carbon double bond...</p>
            <div className="rounded-[6px] border border-border/50 bg-secondary/50 px-3 py-2 font-brand text-[11px] text-accent">
              CH₂=CH₂ + Br₂ → CH₂BrCH₂Br (anti addition via bromonium ion)
            </div>
            <p className="text-muted-foreground">Source: <span className="text-accent/70 hover:text-accent cursor-pointer underline">Lecture 04, p.2-3</span> · <span className="text-accent/70 hover:text-accent cursor-pointer underline">Textbook Ch.7, p.145</span></p>
            
            <div className="pt-2 border-t border-border/50">
              <p className="font-semibold text-foreground">Electrophilic Addition</p>
              <p className="text-muted-foreground">The π bond acts as a nucleophile, attacking electrophiles...</p>
              <p className="text-muted-foreground">Source: <span className="text-accent/70 hover:text-accent cursor-pointer underline">Tutorial Notes, p.4-6</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CitationsVisual() {
  return (
    <div className="relative aspect-square max-w-xl mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[16px] bg-card border border-border/50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-secondary/30">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-accent-gold/60" />
            <span className="size-3 rounded-full bg-accent-green/60" />
          </div>
          <span className="ml-3 font-brand text-[10px] text-muted-foreground tracking-wide uppercase">Source Traceability</span>
        </div>
        <div className="p-6 space-y-3">
          <PixelCrabIcon className="size-10 text-accent mx-auto" state="default" pose="D" />
          <div className="space-y-3">
            {[
              { claim: 'Markovnikov addition favors more substituted carbon', sources: ['Lecture 04, p.3', 'Textbook Ch.7, p.142'] },
              { claim: 'Anti addition via bromonium ion intermediate', sources: ['Tutorial Notes, p.5', 'Lecture 04, p.7'] },
              { claim: 'Carbocation stability order: 3° > 2° > 1°', sources: ['Textbook Ch.7, p.138', 'Lecture 04, p.5'] },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-[8px] bg-secondary/30 border border-border/50 hover:border-accent/30 transition-colors cursor-pointer">
                <p className="font-medium text-sm text-foreground mb-1">{item.claim}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.sources.map((s, j) => (
                    <span key={j} className="px-2 py-0.5 text-[10px] font-brand rounded bg-accent/10 text-accent/70 hover:bg-accent/20 transition-colors underline">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="font-brand text-xs text-muted-foreground">Click any citation → jump to source page</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExportVisual() {
  return (
    <div className="relative aspect-square max-w-xl mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[16px] bg-card border border-border/50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-secondary/30">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-accent-gold/60" />
            <span className="size-3 rounded-full bg-accent-green/60" />
          </div>
          <span className="ml-3 font-brand text-[10px] text-muted-foreground tracking-wide uppercase">Export v1</span>
        </div>
        <div className="p-6 space-y-4">
          <PixelCrabIcon className="size-12 text-accent mx-auto" state="compiling" />
          <div className="text-center">
            <p className="font-semibold text-foreground mb-1">Alkenes — Master Note v1</p>
            <p className="text-sm text-muted-foreground">Compiled 2m ago · 94% coverage</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Markdown', desc: 'Clean, portable', icon: FileText },
              { label: 'PDF', desc: 'Formatted, printable', icon: FileText },
              { label: 'DOCX', desc: 'Word compatible', icon: FileText },
              { label: 'Plain Text', desc: 'Raw, no formatting', icon: FileText },
            ].map((format) => (
              <button key={format.label} className="flex flex-col items-center gap-3 p-4 rounded-[8px] border border-border/50 bg-secondary/30 hover:border-accent/30 hover:bg-secondary/50 transition-all text-left group">
                <div className="flex items-center justify-center size-10 rounded-[8px] bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  <format.icon className="size-5" />
                </div>
                <div className="text-center w-full">
                  <div className="font-semibold text-foreground">{format.label}</div>
                  <div className="text-[11px] text-muted-foreground">{format.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="font-brand text-xs text-muted-foreground/60">Version saved · History intact · No lock-in</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== Reduced Motion Fallback ==================== */

function ReducedMotionStory() {
  return (
    <div className="relative flex-1 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <PixelCrabIcon className="size-12 mx-auto mb-6 text-accent" state="default" />
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1]">
            Scattered notes. <br /> <span className="text-accent">One master note.</span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
            Upload PDFs and handwritten scans. PDF-Crab merges them into a single compiled note —
            same wording preserved, duplicates removed, diagrams intact.
          </p>
        </div>

        <div className="space-y-16">
          {STORY_BEATS.map((beat, index) => (
            <article key={beat.id} className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl font-semibold text-accent/30 font-brand">{index + 1}</span>
                <h2 className="font-display text-2xl font-semibold text-foreground">{beat.title}</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed ml-12">{beat.subtitle}</p>
            </article>
          ))}

          <div className="mt-16 text-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto px-10 gap-3 group">
                <span>Start Compiling</span>
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}