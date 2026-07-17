'use client'

import { AnimatedCanvas } from './animated-canvas'

export function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <AnimatedCanvas
        variant="waves"
        intensity="vivid"
        colorScheme="warm"
        interactive={false}
        className="opacity-40"
      />
    </div>
  )
}