import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/reveal'
import { HeroMockup } from '@/components/hero-mockup'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section id="home" className="relative mx-auto max-w-6xl px-5 pt-28 pb-24 sm:pt-36">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Turn scattered notes into one Master Note.
          </h1>
        </Reveal>

        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Merge multiple PDFs and handwritten notes into one complete, non-repetitive Master
            Note while preserving diagrams, formulas and original wording.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-9 flex justify-center">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'rounded-xl bg-accent px-5 text-accent-foreground hover:bg-accent/90',
              )}
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={260} className="mt-20">
        <HeroMockup />
      </Reveal>
    </section>
  )
}
