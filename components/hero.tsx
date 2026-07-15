import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/reveal'
import { HeroMockup } from '@/components/hero-mockup'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section id="home" className="relative mx-auto max-w-lg px-5 pt-28 pb-20 sm:pt-32">
      <div className="mx-auto text-center">
        <Reveal>
          <p className="font-brand text-[10px] uppercase tracking-[0.25em] text-accent/80 mb-4">
            Knowledge workspace
          </p>
          <h1 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            Scattered notes. One master note.
          </h1>
        </Reveal>

        <Reveal delay={100}>
          <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
            Upload PDFs and handwritten pages. PDF-Crab merges them into a single compiled note —
            same wording, no duplicates, diagrams intact.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: 'lg' }), 'px-6')}
            >
              Open the archive
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={260} className="mt-14">
        <HeroMockup />
      </Reveal>
    </section>
  )
}
