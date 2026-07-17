'use client'

import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/30">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-8">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 64 64"
            className="size-5 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <ellipse cx="32" cy="38" rx="18" ry="10" />
            <ellipse cx="32" cy="32" rx="13" ry="8" />
            <path d="M14 32 Q10 24 14 18 Q18 26 14 32" />
            <path d="M50 32 Q54 24 50 18 Q46 26 50 32" />
            <path d="M18 42 Q14 48 18 52 Q22 46 18 42" />
            <path d="M46 42 Q50 48 46 52 Q42 46 46 42" />
            <circle cx="26" cy="24" r="2" fill="#08090c" />
            <circle cx="38" cy="24" r="2" fill="#08090c" />
            <circle cx="25" cy="23" r="0.5" fill="#fff" />
            <circle cx="37" cy="23" r="0.5" fill="#fff" />
          </svg>
          <span className="font-brand text-sm font-semibold tracking-tight text-foreground">
            PDF-Crab
          </span>
        </div>

        <p className="text-center text-xs text-muted-foreground max-w-xs leading-relaxed">
          A knowledge workspace for students who collect more notes than they can read.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/60">
          <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.36 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.002.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.869 1.235 1.938 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12" />
            </svg>
            <span>GitHub</span>
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
    </footer>
  )
}