'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { MASCOT_DIALOGUES } from './mascot-dialogues'
import {
  MascotContext,
  MascotEmotion,
  MascotPose,
  MascotOverride,
  MascotContextValue,
} from './mascot-context'

export function MascotProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [override, setOverride] = useState<MascotOverride>(null)
  
  // Track indices for categories to cycle through them
  const [indices, setIndices] = useState<Record<string, number>>({})
  const [pickCount, setPickCount] = useState(0)
  
  // Current active states
  const [dialogue, setDialogue] = useState('')
  const [emotion, setEmotion] = useState<MascotEmotion>('default')
  const [pose, setPose] = useState<MascotPose>('A')
  const [rotateCounter, setRotateCounter] = useState(0)

  // Resolve category from pathname
  const routeCategory = useMemo(() => {
    if (!pathname) return 'landing'
    if (pathname === '/') return 'landing'
    if (pathname === '/login') return 'login'
    if (pathname === '/dashboard') return 'vaults'
    if (pathname.startsWith('/vault/')) return 'vault'
    if (pathname.startsWith('/search')) return 'search'
    if (pathname.startsWith('/profile')) return 'profile'
    if (pathname.startsWith('/settings')) return 'settings'
    if (pathname.startsWith('/master/')) return 'vault'
    return 'vaults'
  }, [pathname])

  const rotateDialogue = useCallback(() => {
    // 1. Determine active category
    const category = override?.category ?? routeCategory
    
    // 2. Rare check
    const nextPickCount = pickCount + 1
    setPickCount(nextPickCount)
    
    let selectedText = ''
    const isRare = nextPickCount > 0 && nextPickCount % 13 === 0
    
    if (override?.dialogue) {
      selectedText = override.dialogue
    } else if (isRare) {
      const rareList = MASCOT_DIALOGUES.rare
      const idx = Math.floor(Math.random() * rareList.length)
      selectedText = rareList[idx]
    } else {
      const list = MASCOT_DIALOGUES[category] || MASCOT_DIALOGUES.vaults
      const currentIndex = indices[category] ?? 0
      selectedText = list[currentIndex]
      
      // Cycle indices
      setIndices((prev) => ({
        ...prev,
        [category]: (currentIndex + 1) % list.length,
      }))
    }

    setDialogue(selectedText)

    // 3. Resolve emotion based on override, category, or selectedText
    let resolvedEmotion: MascotEmotion = 'default'
    if (override?.emotion) {
      resolvedEmotion = override.emotion
    } else {
      const lower = selectedText.toLowerCase()
      if (
        lower.includes('confused') ||
        lower.includes('lost') ||
        lower.includes('difficult') ||
        lower.includes('hard') ||
        lower.includes('twice') ||
        lower.includes('defeat') ||
        lower.includes('equation')
      ) {
        resolvedEmotion = 'confused'
      } else if (
        lower.includes('sleep') ||
        lower.includes('quiet') ||
        lower.includes('peaceful') ||
        lower.includes('rest')
      ) {
        resolvedEmotion = 'sleepy'
      } else if (
        lower.includes('safe') ||
        lower.includes('grow') ||
        lower.includes('tidy') ||
        lower.includes('kept')
      ) {
        resolvedEmotion = 'proud'
      } else if (
        lower.includes('like') ||
        lower.includes('happy') ||
        lower.includes('fit') ||
        lower.includes('share') ||
        lower.includes('belongs')
      ) {
        resolvedEmotion = 'happy'
      } else if (
        lower.includes('too many') ||
        lower.includes('complicated') ||
        lower.includes('switches')
      ) {
        resolvedEmotion = 'overwhelmed'
      }
    }
    setEmotion(resolvedEmotion)

    // 4. Randomize pose
    const poses: MascotPose[] = ['A', 'B', 'C', 'D']
    const nextPose = poses[Math.floor(Math.random() * poses.length)]
    setPose(nextPose)
  }, [override, routeCategory, pickCount, indices])

  // Trigger dialogue rotate on page change or override change
  useEffect(() => {
    rotateDialogue()
  }, [pathname, override])

  // Timer-based inactive rotation (45s to 90s)
  useEffect(() => {
    const delay = Math.floor(Math.random() * 45000) + 45000
    const timer = setTimeout(() => {
      setRotateCounter((c) => c + 1)
      rotateDialogue()
    }, delay)
    return () => clearTimeout(timer)
  }, [pathname, override, rotateCounter, rotateDialogue])

  const state = useMemo(() => {
    if (override?.state) return override.state
    if (pathname && pathname.startsWith('/search')) return 'searching'
    return 'default'
  }, [override, pathname])

  const contextValue = useMemo<MascotContextValue>(() => {
    return {
      dialogue,
      emotion,
      pose,
      state,
      override,
      setOverride,
    }
  }, [dialogue, emotion, pose, state, override])

  return (
    <MascotContext.Provider value={contextValue}>
      {children}
    </MascotContext.Provider>
  )
}
