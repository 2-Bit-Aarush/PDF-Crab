import { cn } from '@/lib/utils'

interface PixelProgressProps {
  value: number // percentage (0-100) or count
  maxBlocks?: number // number of block segments, defaults to 10
  className?: string
}

/**
 * PixelProgress - Premium segmented block visual indicator for knowledge completeness
 * Renders filled blocks (■) and empty blocks (□) based on the current progress percentage.
 */
export function PixelProgress({ value, maxBlocks = 10, className }: PixelProgressProps) {
  // Clamp value between 0 and 100
  const normalizedValue = Math.min(100, Math.max(0, value))
  
  // Calculate how many blocks are filled
  const filledBlocks = Math.round((normalizedValue / 100) * maxBlocks)

  return (
    <div
      className={cn(
        'flex items-center gap-1 font-mono text-[13px] tracking-widest text-accent select-none',
        className
      )}
      aria-label={`${normalizedValue}% progress`}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: maxBlocks }).map((_, idx) => {
        const isFilled = idx < filledBlocks
        return (
          <span
            key={idx}
            className={cn(
              'transition-colors duration-200',
              isFilled ? 'text-accent font-bold' : 'text-muted-foreground/25'
            )}
          >
            {isFilled ? '■' : '□'}
          </span>
        )
      })}
    </div>
  )
}
