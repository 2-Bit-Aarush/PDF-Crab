'use client'

import { useEffect, useState } from 'react'
import { useMascot } from '@/components/mascot/mascot-context'
import { PixelCrabIcon } from '@/components/pixel-icons'
import { cn } from '@/lib/utils'

const SPLASH_MESSAGES = [
  'Initializing knowledge core...',
  'Calibrating pixel arrays...',
  'Syncing with the archive...',
  'Warming up the compiler...',
  'Ready to compile your notes.',
]

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const { setOverride } = useMascot()
  const [pose, setPose] = useState(0)

  useEffect(() => {
    setOverride({ category: 'splash', emotion: 'default' })
    return () => setOverride(null)
  }, [setOverride])

  useEffect(() => {
    const poseTimer = setInterval(() => {
      setPose(p => (p + 1) % 4)
    }, 300)

    const messageTimer = setInterval(() => {
      setMessageIndex(m => (m + 1) % SPLASH_MESSAGES.length)
    }, 400)

    return () => {
      clearInterval(poseTimer)
      clearInterval(messageTimer)
    }
  }, [])

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1600)
    const doneTimer = setTimeout(() => onComplete(), 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background',
        fading && 'animate-fade-out pointer-events-none'
      )}
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="flex flex-col items-center gap-4">
        <PixelCrabIcon className="size-20 text-accent" state="default" />
        
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground text-balance">
          PDF<span className="text-accent">-</span>Crab
        </h1>
        
        <p className="font-brand text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
          Knowledge Compiler v0.1.0
        </p>
      </div>

      <div className="w-full max-w-md px-8">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-coral rounded-full animate-shimmer"
            style={{ width: '100%' }}
          />
        </div>
        
        <p className={cn(
          'mt-3 text-center font-brand text-xs uppercase tracking-wider text-muted-foreground/70',
          'animate-fade-in'
        )}>
          {SPLASH_MESSAGES[messageIndex]}
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-brand text-muted-foreground/40">
        <span className="animate-pulse-soft">■</span>
        <span className="animate-pulse-soft" style={{ animationDelay: '200ms' }}>■</span>
        <span className="animate-pulse-soft" style={{ animationDelay: '400ms' }}>■</span>
      </div>
    </div>
  )
}