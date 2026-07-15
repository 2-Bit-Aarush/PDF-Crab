'use client'

import { useEffect, useState } from 'react'
import DecryptedText from '@/components/DecryptedText'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Hold after the decrypt animation, then fade the splash away.
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-black"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 600ms ease-out' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="size-14 select-none sm:size-16" />
      <DecryptedText
        text="PDF-Crab"
        animateOn="view"
        sequential
        speed={80}
        revealDirection="start"
        maxIterations={20}
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*/<>-_"
        parentClassName="select-none"
        className="text-5xl font-semibold tracking-tight text-white sm:text-7xl"
        encryptedClassName="text-5xl font-semibold tracking-tight text-white/30 sm:text-7xl"
      />
    </div>
  )
}
