import { cn } from '@/lib/utils'

interface PixelIconProps {
  className?: string
}

export function PixelFolderIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-10 text-accent/80 fill-current shrink-0', className)}
      aria-hidden="true"
    >
      <rect x="1" y="3" width="5" height="2" />
      <rect x="1" y="5" width="14" height="9" />
      <rect x="2" y="6" width="12" height="7" fill="#08090c" />
      <rect x="3" y="8" width="6" height="1" className="text-accent/25 fill-current" />
      <rect x="3" y="10" width="4" height="1" className="text-accent/25 fill-current" />
    </svg>
  )
}

export function PixelDocIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-10 text-accent/80 fill-current shrink-0', className)}
      aria-hidden="true"
    >
      <rect x="3" y="1" width="10" height="14" />
      <rect x="4" y="2" width="8" height="12" fill="#08090c" />
      <rect x="10" y="2" width="2" height="2" className="text-accent/35 fill-current" />
      <rect x="5" y="5" width="6" height="1" className="text-accent/25 fill-current" />
      <rect x="5" y="7" width="6" height="1" className="text-accent/25 fill-current" />
      <rect x="5" y="9" width="4" height="1" className="text-accent/25 fill-current" />
      <rect x="5" y="11" width="5" height="1" className="text-accent/20 fill-current" />
    </svg>
  )
}

export function PixelPdfIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-10 text-accent/80 fill-current shrink-0', className)}
      aria-hidden="true"
    >
      <rect x="3" y="1" width="10" height="14" />
      <rect x="4" y="2" width="8" height="12" fill="#08090c" />
      <rect x="5" y="4" width="6" height="3" fill="#c44" className="opacity-80" />
      <rect x="6" y="5" width="4" height="1" fill="#fff" opacity="0.85" />
      <rect x="5" y="9" width="6" height="1" className="text-accent/25 fill-current" />
      <rect x="5" y="11" width="4" height="1" className="text-accent/20 fill-current" />
    </svg>
  )
}

export function PixelArchiveIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-10 text-accent/80 fill-current shrink-0', className)}
      aria-hidden="true"
    >
      <rect x="2" y="1" width="12" height="14" />
      <rect x="3" y="2" width="10" height="12" fill="#08090c" />
      <rect x="4" y="3" width="8" height="4" className="text-muted-foreground/25 fill-current" />
      <rect x="6" y="5" width="4" height="1" className="text-accent fill-current" />
      <rect x="3" y="8" width="10" height="1" className="text-border fill-current" />
      <rect x="4" y="9" width="8" height="4" className="text-muted-foreground/25 fill-current" />
      <rect x="6" y="11" width="4" height="1" className="text-accent fill-current" />
    </svg>
  )
}

/** Compiled master note — connected knowledge nodes */
export function PixelMasterNoteIcon({ className }: PixelIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-10 text-accent/80 fill-current shrink-0', className)}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="12" height="12" />
      <rect x="3" y="3" width="10" height="10" fill="#08090c" />
      <rect x="4" y="4" width="2" height="2" className="text-accent fill-current" />
      <rect x="10" y="4" width="2" height="2" className="text-accent fill-current" />
      <rect x="7" y="7" width="2" height="2" className="text-accent fill-current" />
      <rect x="4" y="10" width="2" height="2" className="text-accent fill-current" />
      <rect x="10" y="10" width="2" height="2" className="text-accent fill-current" />
      <rect x="6" y="5" width="4" height="1" className="text-accent/30 fill-current" />
      <rect x="5" y="6" width="1" height="4" className="text-accent/30 fill-current" />
      <rect x="10" y="6" width="1" height="4" className="text-accent/30 fill-current" />
      <rect x="7" y="9" width="4" height="1" className="text-accent/30 fill-current" />
    </svg>
  )
}

export function PixelKnowledgeIcon({ className }: PixelIconProps) {
  return <PixelMasterNoteIcon className={className} />
}

interface PixelIconProps {
  className?: string
  state?: 'default' | 'searching' | 'compiling' | 'deleting'
  pose?: 'A' | 'B' | 'C' | 'D'
}

export function PixelCrabIcon({ className, state = 'default', pose = 'A' }: PixelIconProps) {
  const clawLClass = cn(
    'c-claw-l',
    pose === 'B' && 'c-pose-b'
  )
  const clawRClass = cn(
    'c-claw-r',
    pose === 'C' && 'c-pose-c'
  )
  const blinkClass = cn(
    state === 'deleting' ? 'c-blink-deleting' : 'c-blink'
  )
  const pupilClass = cn(
    state === 'default' && 'c-look',
    state === 'searching' && 'c-look-searching',
    state === 'compiling' && 'c-look-compiling',
    pose === 'D' && 'c-pose-d'
  )

  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-4 text-accent fill-current shrink-0', className)}
      aria-hidden="true"
    >
      <style>{`
        @keyframes crab-blink {
          0%, 92%, 100% { opacity: 1; }
          94%, 96% { opacity: 0; }
        }
        @keyframes crab-blink-deleting {
          0%, 100% { opacity: 0; }
        }
        @keyframes crab-breathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
        @keyframes crab-claw-l {
          0%, 85%, 100% { transform: translate(0, 0); }
          88% { transform: translate(-1px, 0); }
        }
        @keyframes crab-claw-r {
          0%, 85%, 100% { transform: translate(0, 0); }
          88% { transform: translate(1px, 0); }
        }
        @keyframes crab-look {
          0%, 40%, 80%, 100% { transform: translate(0, 0); }
          45%, 55% { transform: translate(-1px, 0); }
          60%, 75% { transform: translate(1px, 0); }
        }
        @keyframes crab-look-searching {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 0); }
          75% { transform: translate(1px, 0); }
        }
        .c-blink { animation: crab-blink 6s steps(1) infinite; }
        .c-blink-deleting { animation: crab-blink-deleting 1s steps(1) infinite; }
        .c-breathe { animation: crab-breathe 3s steps(1) infinite; }
        .c-claw-l { animation: crab-claw-l 5s steps(1) infinite; }
        .c-claw-r { animation: crab-claw-r 5s steps(1) infinite; }
        .c-look { animation: crab-look 7s steps(1) infinite; }
        .c-look-searching { animation: crab-look-searching 1.5s steps(1) infinite; }
        .c-look-compiling { transform: translate(1px, 1px) !important; }
        .c-pose-b { transform: translateY(-1px) !important; }
        .c-pose-c { transform: translateY(-1px) !important; }
        .c-pose-d { transform: translate(1px, 0) !important; }
      `}</style>

      <g className={clawLClass}>
        <rect x="0" y="5" width="2" height="2" />
        <rect x="0" y="3" width="3" height="2" />
        <rect x="1" y="2" width="1" height="1" />
        <rect x="2" y="2" width="1" height="1" />
      </g>

      <g className={clawRClass}>
        <rect x="14" y="5" width="2" height="2" />
        <rect x="13" y="3" width="3" height="2" />
        <rect x="13" y="2" width="1" height="1" />
        <rect x="14" y="2" width="1" height="1" />
      </g>

      <g className="c-breathe">
        <rect x="3" y="11" width="1" height="2" />
        <rect x="5" y="11" width="1" height="2" />
        <rect x="7" y="11" width="1" height="2" />
        <rect x="9" y="11" width="1" height="2" />
        <rect x="11" y="11" width="1" height="2" />

        <rect x="4" y="6" width="8" height="5" />
        <rect x="3" y="7" width="10" height="3" />
        <rect x="5" y="5" width="6" height="1" />
        <rect x="5" y="10" width="6" height="1" fill="#000" opacity="0.2" />

        <rect x="5" y="4" width="1" height="1" />
        <rect x="10" y="4" width="1" height="1" />

        <g className={blinkClass}>
          <rect x="4" y="1" width="3" height="3" fill="#111" />
          <rect x="9" y="1" width="3" height="3" fill="#111" />
          <g className={pupilClass}>
            <rect x="5" y="2" width="1" height="1" fill="#fff" />
            <rect x="10" y="2" width="1" height="1" fill="#fff" />
          </g>
        </g>
      </g>
    </svg>
  )
}
