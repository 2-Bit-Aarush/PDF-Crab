import { Reveal } from '@/components/reveal'
import { Upload, ScanText, Network, Copy, FileCheck, ArrowRight } from 'lucide-react'

const steps = [
  { icon: Upload, label: 'Upload', meta: 'PDFs & handwriting' },
  { icon: ScanText, label: 'OCR', meta: 'Extract everything' },
  { icon: Network, label: 'Knowledge Mapping', meta: 'Group by topic' },
  { icon: Copy, label: 'Duplicate Removal', meta: 'Keep it clean' },
  { icon: FileCheck, label: 'Master Note', meta: 'One source of truth' },
]

export function Workflow() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal className="max-w-2xl">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          How it works
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Five deliberate steps from scattered material to a finished Master Note.
        </p>
      </Reveal>

      <div className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {steps.map((step, i) => (
          <Reveal key={step.label} delay={i * 80} className="flex-1">
            <div className="flex items-center gap-4 lg:flex-col lg:gap-3">
              <div className="w-full rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary">
                    <step.icon className="size-[18px] text-accent" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{step.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.meta}</p>
              </div>
              {i < steps.length - 1 ? (
                <ArrowRight className="size-4 shrink-0 rotate-90 text-muted-foreground lg:hidden" />
              ) : null}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
