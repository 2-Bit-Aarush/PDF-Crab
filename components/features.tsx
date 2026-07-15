import { Reveal } from '@/components/reveal'
import {
  PixelPdfIcon,
  PixelMasterNoteIcon,
  PixelFolderIcon,
  PixelArchiveIcon,
} from '@/components/pixel-icons'

const features = [
  {
    icon: PixelPdfIcon,
    title: 'Source intake',
    description:
      'PDFs and handwritten scans enter the archive. Layout, formulas, and diagrams stay attached to the text.',
  },
  {
    icon: PixelMasterNoteIcon,
    title: 'Topic alignment',
    description:
      'Fragments are sorted by topic. Related concepts sit together without rewriting your words.',
  },
  {
    icon: PixelFolderIcon,
    title: 'Master note compile',
    description:
      'Every unique passage merges into one note. Duplicates drop out. Original phrasing remains.',
  },
  {
    icon: PixelArchiveIcon,
    title: 'Source traceability',
    description:
      'Each line links back to its document and page. Nothing drifts from where it came from.',
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-lg px-5 py-20">
      <Reveal>
        <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">
          Built for notes, not summaries.
        </h2>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground text-sm">
          A quiet workspace for turning a pile of material into one reference you can trust.
        </p>
      </Reveal>

      <div className="mt-10 flex flex-col gap-8">
        {features.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 60}>
            <article className="flex gap-4">
              <feature.icon className="size-8 shrink-0 text-accent/70" />
              <div>
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </article>
            {i < features.length - 1 && <hr className="pixel-divider mt-8" />}
          </Reveal>
        ))}
      </div>
    </section>
  )
}
