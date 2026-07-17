'use client'

import { cn } from '@/lib/utils'

interface PixelProgressProps {
  value: number
  maxBlocks?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  variant?: 'blocks' | 'bar' | 'dots' | 'segments'
  color?: 'default' | 'accent' | 'coral' | 'gold' | 'green' | 'purple'
}

const colorClasses = {
  default: 'text-accent',
  accent: 'text-accent',
  coral: 'text-accent-coral',
  gold: 'text-accent-gold',
  green: 'text-accent-green',
  purple: 'text-accent-purple',
}

const sizeClasses = {
  sm: { block: 'text-[11px]', gap: 'gap-0.5', label: 'text-[10px]' },
  md: { block: 'text-[13px]', gap: 'gap-1', label: 'text-[11px]' },
  lg: { block: 'text-[16px]', gap: 'gap-1.5', label: 'text-[12px]' },
}

const variantBlocks = {
  blocks: { filled: '■', empty: '□' },
  dots: { filled: '●', empty: '○' },
  segments: { filled: '▰', empty: '▱' },
  bar: { filled: '█', empty: '░' },
}

export function PixelProgress({
  value,
  maxBlocks = 10,
  className,
  size = 'md',
  showLabel = false,
  label,
  variant = 'blocks',
  color = 'default',
}: PixelProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  const filledBlocks = Math.round((normalizedValue / 100) * maxBlocks)
  const { block, gap, label: labelSize } = sizeClasses[size]
  const { filled, empty } = variantBlocks[variant]

  return (
    <div
      className={cn(
        'flex items-center',
        gap,
        className
      )}
      aria-label={`${label || 'Progress'}: ${normalizedValue}%`}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('flex items-center', colorClasses[color], block)}>
        {Array.from({ length: maxBlocks }).map((_, idx) => {
          const isFilled = idx < filledBlocks
          return (
            <span
              key={idx}
              className={cn(
                'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isFilled ? 'font-bold' : 'opacity-20'
              )}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {isFilled ? filled : empty}
            </span>
          )
        })}
      </div>
      {(showLabel || label) && (
        <span className={cn('font-brand tabular-nums whitespace-nowrap', labelSize, colorClasses[color])}>
          {label ? `${label} ${normalizedValue}%` : `${normalizedValue}%`}
        </span>
      )}
    </div>
  )
}

interface PixelProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  color?: 'default' | 'accent' | 'coral' | 'gold' | 'green' | 'purple'
}

export function PixelProgressRing({
  value,
  size = 48,
  strokeWidth = 4,
  className,
  showValue = true,
  color = 'default',
}: PixelProgressRingProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalizedValue / 100) * circumference

  const ringColors = {
    default: 'stroke-accent',
    accent: 'stroke-accent',
    coral: 'stroke-accent-coral',
    gold: 'stroke-accent-gold',
    green: 'stroke-accent-green',
    purple: 'stroke-accent-purple',
  }

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${normalizedValue}%`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            ringColors[color]
          )}
          style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
        />
      </svg>
      {showValue && (
        <span className={cn('absolute font-brand tabular-nums text-center', colorClasses[color])}>
          {normalizedValue}%
        </span>
      )}
    </div>
  )
}

interface PixelStepProgressProps {
  steps: { label: string; completed: boolean; current?: boolean }[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function PixelStepProgress({
  steps,
  className,
  orientation = 'horizontal',
}: PixelStepProgressProps) {
  return (
    <div
      className={cn(
        'flex items-center',
        orientation === 'horizontal' ? 'gap-2' : 'flex-col gap-4 items-start',
        className
      )}
      role="list"
      aria-label="Progress steps"
    >
      {steps.map((step, index) => (
        <div key={step.label} className={cn('flex items-center gap-2', orientation === 'vertical' && 'flex-col items-start')}>
          <div className="relative flex items-center justify-center">
            {index < steps.length - 1 && orientation === 'horizontal' && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 w-4 h-0.5"
                style={{ background: 'linear-gradient(90deg, var(--border) 50%, transparent 50%)', backgroundSize: '4px 1px' }}
                aria-hidden="true"
              />
            )}
            {index < steps.length - 1 && orientation === 'vertical' && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 h-4 w-0.5"
                style={{ background: 'linear-gradient(180deg, var(--border) 50%, transparent 50%)', backgroundSize: '1px 4px' }}
                aria-hidden="true"
              />
            )}
            <div
              className={cn(
                'relative z-10 flex size-6 items-center justify-center rounded-full font-brand text-xs transition-all duration-300',
                step.completed
                  ? 'bg-accent text-primary-foreground'
                  : step.current
                    ? 'bg-accent/20 text-accent ring-2 ring-accent/40'
                    : 'bg-muted text-muted-foreground/40'
              )}
            >
              {step.completed ? '✓' : step.current ? index + 1 : ''}
            </div>
          </div>
          <span
            className={cn(
              'font-brand text-xs whitespace-nowrap transition-colors duration-200',
              step.completed ? 'text-foreground' : step.current ? 'text-accent' : 'text-muted-foreground/60'
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}