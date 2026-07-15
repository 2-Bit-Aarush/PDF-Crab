'use client'

import { createContext, useContext } from 'react'

export type MascotEmotion =
  | 'default'
  | 'confused'
  | 'impressed'
  | 'worried'
  | 'proud'
  | 'sleepy'
  | 'overwhelmed'
  | 'happy'

export type MascotPose = 'A' | 'B' | 'C' | 'D'

export type MascotOverride = {
  category?: string
  state?: 'default' | 'searching' | 'compiling' | 'deleting'
  dialogue?: string
  emotion?: MascotEmotion
} | null

export type MascotContextValue = {
  dialogue: string
  emotion: MascotEmotion
  pose: MascotPose
  state: 'default' | 'searching' | 'compiling' | 'deleting'
  override: MascotOverride
  setOverride: (override: MascotOverride) => void
}

export const MascotContext = createContext<MascotContextValue | null>(null)

export function useMascot() {
  const ctx = useContext(MascotContext)
  if (!ctx) throw new Error('useMascot must be used within MascotProvider')
  return ctx
}
