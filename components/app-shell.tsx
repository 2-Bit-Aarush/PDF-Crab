'use client'

import { useState } from 'react'
import { SplashScreen } from '@/components/splash-screen'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash ? <SplashScreen onComplete={() => setShowSplash(false)} /> : null}
      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 700ms ease-out',
        }}
      >
        {children}
      </div>
    </>
  )
}
