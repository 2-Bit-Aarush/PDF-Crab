'use client'

import { useMascot } from './mascot-context'
import { PixelCrabIcon } from '../pixel-icons'
import { cn } from '@/lib/utils'

export function CrabCaretaker({ className }: { className?: string }) {
  const { dialogue, state, pose } = useMascot()

  if (!dialogue) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 max-w-xs sm:max-w-sm select-none animate-slide-fade text-left pr-4',
        className
      )}
      aria-live="polite"
    >
      <PixelCrabIcon
        state={state}
        pose={pose}
        className="size-[22px] shrink-0 text-accent/70 mt-0.5"
      />
      <p className="font-pixelify text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line tracking-wide">
        {dialogue}
      </p>
    </div>
  )
}
