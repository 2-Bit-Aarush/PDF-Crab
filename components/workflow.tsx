import { Reveal } from '@/components/reveal'
import { PixelPdfIcon, PixelDocIcon, PixelMasterNoteIcon, PixelArchiveIcon, PixelFolderIcon } from '@/components/pixel-icons'

const steps = [
  { icon: PixelPdfIcon, label: 'Upload', meta: 'PDFs and handwritten pages' },
  { icon: PixelDocIcon, label: 'Extract', meta: 'Text, layout, and diagrams' },
  { icon: PixelFolderIcon, label: 'Sort', meta: 'Group by topic' },
  { icon: PixelArchiveIcon, label: 'Dedupe', meta: 'Remove repetition' },
  { icon: PixelMasterNoteIcon, label: 'Compile', meta: 'One master note' },
]

export function Workflow() {
  return (
    <section id="how-it-works" className="mx-auto max-w-lg px-5 py-20">
      <Reveal>
        <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">
          From pile to master note
        </h2>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
          Five deliberate steps. No black box. Your wording stays yours.
        </p>
      </Reveal>

      <div className="mt-10 flex flex-col">
        {steps.map((step, i) => (
          <Reveal key={step.label} delay={i * 50}>
            <div className="flex items-start gap-4 py-4">
              <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                <step.icon className="size-7 text-accent/70" />
                <span className="font-brand text-[9px] text-muted-foreground/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="text-sm font-semibold text-foreground">{step.label}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.meta}</p>
              </div>
            </div>
            {i < steps.length - 1 && <hr className="pixel-divider" />}
          </Reveal>
        ))}
      </div>
    </section>
  )
}
