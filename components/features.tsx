'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/reveal'
import { HeroMockup } from '@/components/hero-mockup'
import { ArrowRight, Sparkles, Rocket, Brain, Layers, FileText, Microscope } from 'lucide-react'
import { PixelFolderIcon, PixelDocIcon, PixelMasterNoteIcon, PixelCrabIcon } from '@/components/pixel-icons'

const FEATURES = [
  {
    icon: PixelCrabIcon,
    title: 'Zero Information Loss',
    description: 'Preserves every formula, derivation, proof, and example. Never summarizes by omission.',
  },
  {
    icon: PixelFolderIcon,
    title: 'Merge Complementary Knowledge',
    description: 'Combines explanations from multiple sources into richer, more complete understanding.',
  },
  {
    icon: PixelDocIcon,
    title: 'True Duplicate Removal',
    description: 'Only removes semantically identical content. Different perspectives are always preserved.',
  },
  {
    icon: Microscope,
    title: 'Source Traceability',
    description: 'Every section traces back to source documents with page-level references.',
  },
  {
    icon: Rocket,
    title: 'Versioned Master Notes',
    description: 'Iterative compilation with full history. Compare versions, rollback anytime.',
  },
  {
    icon: Sparkles,
    title: 'Export Anywhere',
    description: 'Markdown, PDF, DOCX, or plain text. Take your compiled knowledge everywhere.',
  },
] as const

const WORKFLOW_STEPS = [
  { number: '01', title: 'Upload Sources', description: 'Drop PDFs, scans, or handwritten notes. OCR runs automatically.' },
  { number: '02', title: 'Create Master Note', description: 'Give it a title. Add sources from any vault.' },
  { number: '03', title: 'Compile', description: 'Hit compile. PDF-Crab merges, deduplicates, and structures your knowledge.' },
  { number: '04', title: 'Read & Export', description: 'Read the unified note. Export to Markdown, PDF, or Word.' },
] as const

export function Hero() {
  return (
    <section id="home" className="relative mx-auto max-w-5xl px-5 pt-20 pb-16 sm:pt-28">
      <div className="mx-auto text-center max-w-3xl">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6">
            <Sparkles className="size-3" />
            Knowledge Compiler v0.1.0
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance">
            Scattered notes.
            <br />
            <span className="text-accent">One master note.</span>
          </h1>
        </Reveal>

        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Upload PDFs and handwritten pages. PDF-Crab merges them into a single compiled note —
            same wording, no duplicates, diagrams intact.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-10 flex justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="px-6 gap-2">
                Start Compiling
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="#features" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[8px] border border-border bg-secondary/50 text-secondary-foreground font-semibold text-sm hover:bg-secondary transition-colors duration-180">
              See How It Works
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={260} className="mt-16">
        <HeroMockup />
      </Reveal>

      <Reveal delay={340} className="mt-20">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground/70 font-brand">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-accent" />
            Zero Information Loss
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="size-3 text-accent" />
            Source Traceability
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="size-3 text-accent" />
            Versioned Compilation
          </span>
          <span className="flex items-center gap-1.5">
            <Rocket className="size-3 text-accent" />
            Export Anywhere
          </span>
        </div>
      </Reveal>
    </section>
  )
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-5 py-20">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <Reveal>
          <p className="font-brand text-xs uppercase tracking-[0.3em] text-accent/80 mb-3">
            Core Philosophy
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Not an AI summarizer.{' '}
            <span className="text-accent">A Knowledge Compiler.</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Every design decision optimizes for completeness over brevity.
          </p>
        </Reveal>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 60} className="group">
            <div className="card-base card-hover p-6 h-full transition-all duration-300">
              <div className="mb-4 inline-flex items-center justify-center size-12 rounded-[10px] bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors duration-300">
                <feature.icon className="size-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-accent transition-colors duration-200">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Workflow() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-5 py-20">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <Reveal>
          <p className="font-brand text-xs uppercase tracking-[0.3em] text-accent/80 mb-3">
            How It Works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-foreground">
            From scattered to structured in four steps
          </h2>
        </Reveal>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: 'linear-gradient(180deg, var(--border) 50%, transparent 50%)', backgroundSize: '1px 16px' }} aria-hidden="true" />
        
        <div className="space-y-12">
          {WORKFLOW_STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 100}>
              <div className="relative flex gap-6 sm:flex-row-reverse">
                <div className="flex-1 min-w-0 pt-2 sm:pr-8 sm:text-right sm:w-1/2">
                  <div className="inline-flex items-center gap-2 font-brand text-xs uppercase tracking-wider text-accent/70 mb-2">
                    <span className="font-display text-2xl font-semibold text-foreground">{step.number}</span>
                    Step
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                <div className="relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                  <div className="relative z-10 flex size-12 sm:size-14 items-center justify-center rounded-full bg-card border border-border flex-shrink-0">
                    <span className="font-display text-2xl sm:text-3xl font-semibold text-accent">
                      {step.number}
                    </span>
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full" style={{ background: 'linear-gradient(180deg, var(--border) 50%, transparent 50%)', backgroundSize: '1px 16px' }} aria-hidden="true" />
                </div>
                
                <div className="flex-1 min-w-0 pt-2 sm:pl-8 sm:w-1/2">
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}