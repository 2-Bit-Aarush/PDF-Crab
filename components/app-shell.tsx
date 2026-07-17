'use client'

import { useState, useEffect, useCallback } from 'react'
import { SplashScreen } from '@/components/splash-screen'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [pageTransition, setPageTransition] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowSplash(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  const triggerPageTransition = useCallback(() => {
    setPageTransition(true)
    setTimeout(() => setPageTransition(false), 200)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            viewBox="0 0 64 64"
            className="size-16 text-accent animate-pulse-soft"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <ellipse cx="32" cy="42" rx="18" ry="10" />
            <ellipse cx="32" cy="35" rx="13" ry="8" />
            <path d="M14 35 Q10 28 14 24 Q18 30 14 35" />
            <path d="M50 35 Q54 28 50 24 Q46 30 50 35" />
            <path d="M18 48 Q15 52 18 54 Q22 51 18 48" />
            <path d="M46 48 Q49 52 46 54 Q42 51 46 48" />
            <circle className="crab-eye" cx="26" cy="33" r="2" fill="#08090c" />
            <circle className="crab-eye" cx="38" cy="33" r="2" fill="#08090c" />
            <circle cx="25" cy="32" r="0.5" fill="#fff" />
            <circle cx="37" cy="32" r="0.5" fill="#fff" />
          </svg>
          <p className="font-brand text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Loading archive...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : null}
      <div
        className={cn(
          'fixed inset-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <div
          className={cn(
            'fixed inset-0 z-[5] pointer-events-none transition-opacity duration-200',
            pageTransition ? 'opacity-50' : 'opacity-0'
          )}
          aria-hidden="true"
        />
        {children}
      </div>
    </>
  )
}