'use client'

import { useEffect, useState } from 'react'
import DecryptedText from '@/components/DecryptedText'
import { CrabCaretaker } from '@/components/mascot/crab-caretaker'
import { useMascot } from '@/components/mascot/mascot-context'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false)
  const { setOverride } = useMascot()

  useEffect(() => {
    setOverride({ category: 'splash', emotion: 'default' })
    return () => setOverride(null)
  }, [setOverride])

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1400)
    const doneTimer = setTimeout(() => onComplete(), 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-[#08090c]"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="size-12 select-none" />
      <DecryptedText
        text="PDF-Crab"
        animateOn="view"
        sequential
        speed={80}
        revealDirection="start"
        maxIterations={20}
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        parentClassName="select-none font-brand"
        className="font-brand text-4xl font-semibold tracking-tight text-white sm:text-5xl"
        encryptedClassName="font-brand text-4xl font-semibold tracking-tight text-white/25 sm:text-5xl"
      />
      <p className="font-brand text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
        v0.1.0
      </p>

      <div className="absolute bottom-12 flex justify-center w-full px-5">
        <CrabCaretaker />
      </div>
    </div>
  )
}
