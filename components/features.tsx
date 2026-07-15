import { Reveal } from '@/components/reveal'
import { ScanText, Network, FileStack, Link2 } from 'lucide-react'

const features = [
  {
    icon: ScanText,
    title: 'Smart OCR',
    description:
      'Reads printed and handwritten notes with high accuracy, capturing diagrams, formulas and layout — not just plain text.',
  },
  {
    icon: Network,
    title: 'Knowledge Mapping',
    description:
      'Automatically organizes fragments into a structured knowledge map so related concepts sit together.',
  },
  {
    icon: FileStack,
    title: 'Master Note Generation',
    description:
      'Merges every source into one complete, non-repetitive note while preserving your original wording.',
  },
  {
    icon: Link2,
    title: 'Source References',
    description:
      'Every line traces back to its source document and page, so nothing is ever lost or unverifiable.',
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal className="max-w-2xl">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything your notes need. Nothing they don&apos;t.
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          A focused toolkit for turning a messy pile of material into a single, trustworthy
          reference.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {features.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 80}>
            <div className="h-full rounded-2xl border border-border bg-card p-7 transition-colors hover:border-white/15">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary">
                <feature.icon className="size-[18px] text-accent" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
