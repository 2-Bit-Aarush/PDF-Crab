'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

export const easings = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.7, 0, 1, 0.5)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
  snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

export const durations = {
  instant: 50,
  fast: 100,
  normal: 180,
  slow: 280,
  slower: 400,
} as const

export const transitions = {
  instant: { duration: durations.instant, easing: easings.easeOut },
  fast: { duration: durations.fast, easing: easings.easeOut },
  normal: { duration: durations.normal, easing: easings.easeOut },
  slow: { duration: durations.slow, easing: easings.easeOut },
  spring: { duration: durations.slower, easing: easings.spring },
  bouncy: { duration: durations.slower, easing: easings.bouncy },
} as const

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function useSpring(
  to: number,
  { stiffness = 300, damping = 30, mass = 1 } = {}
): number {
  const [value, setValue] = useState(to)
  const velocityRef = useRef(0)
  const toRef = useRef(to)
  const frameRef = useRef<number | null>(null)

  toRef.current = to

  const step = useCallback(() => {
    const displacement = toRef.current - value
    const force = displacement * stiffness
    const dampedForce = force - velocityRef.current * damping
    const acceleration = dampedForce / mass
    velocityRef.current += acceleration * (1000 / 60)
    const newValue = value + velocityRef.current * (1000 / 60)

    if (Math.abs(newValue - toRef.current) < 0.01 && Math.abs(velocityRef.current) < 0.01) {
      setValue(toRef.current)
      velocityRef.current = 0
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      return
    }

    setValue(newValue)
    frameRef.current = requestAnimationFrame(step)
  }, [value])

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(step)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [to, step])

  return value
}

export function useTransition<T>(
  value: T,
  config?: { duration?: number; easing?: string }
): T {
  const [displayValue, setDisplayValue] = useState(value)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      setDisplayValue(value)
      return
    }
    setDisplayValue(value)
  }, [value, reduced])

  return displayValue
}

export function useAnimatedValue(initial: number = 0) {
  const [value, setValue] = useState(initial)
  const reduced = useReducedMotion()

  const animate = useCallback((to: number, config = { duration: 180, easing: easings.easeOut }) => {
    if (reduced) {
      setValue(to)
      return
    }
    const start = value
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / config.duration, 1)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      setValue(start + (to - start) * eased)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, reduced])

  return { value, setValue: animate }
}

export function useStaggeredAnimation(
  count: number,
  baseDelay: number = 30
): { delay: number; animate: boolean }[] {
  const [trigger, setTrigger] = useState(0)

  return Array.from({ length: count }, (_, i) => ({
    delay: i * baseDelay,
    animate: trigger > 0,
  }))
}

export function useMountAnimation(delay: number = 0) {
  const [mounted, setMounted] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      setMounted(true)
      return
    }
    const timer = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(timer)
  }, [delay, reduced])

  return mounted
}

export function useHover() {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const enter = () => setHovered(true)
    const leave = () => setHovered(false)
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [])

  return { ref, hovered }
}

export function usePress() {
  const [pressed, setPressed] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const down = () => setPressed(true)
    const up = () => setPressed(false)
    el.addEventListener('mousedown', down)
    el.addEventListener('touchstart', down)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => {
      el.removeEventListener('mousedown', down)
      el.removeEventListener('touchstart', down)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchend', up)
    }
  }, [])

  return { ref, pressed }
}

export function useFocusVisible() {
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const focus = () => setFocused(true)
    const blur = () => setFocused(false)
    el.addEventListener('focus', focus)
    el.addEventListener('blur', blur)
    return () => {
      el.removeEventListener('focus', focus)
      el.removeEventListener('blur', blur)
    }
  }, [])

  return { ref, focused }
}

export function useTapHighlight() {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const combinedRef = useCallback(
    (el: HTMLElement | null) => {
      // No-op for now - we use state for tracking
    },
    []
  )

  return {
    ref: combinedRef,
    active: pressed || hovered || focused,
    handlers: {
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
      onMouseLeave: () => setPressed(false),
      onMouseEnter: () => setHovered(true),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  }
}

export const keyframes = {
  fadeIn: `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `,
  fadeOut: `
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  `,
  slideUp: `
    @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `,
  slideDown: `
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  `,
  slideLeft: `
    @keyframes slideLeft { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
  `,
  slideRight: `
    @keyframes slideRight { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
  `,
  scaleIn: `
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `,
  scaleOut: `
    @keyframes scaleOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
  `,
  shimmer: `
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  `,
  pulse: `
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `,
  spin: `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `,
  float: `
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  `,
  pixelPop: `
    @keyframes pixelPop { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
  `,
  crtFlicker: `
    @keyframes crtFlicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.98; } }
  `,
  scanline: `
    @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
  `,
  glow: `
    @keyframes glow { from { box-shadow: 0 0 20px rgba(255, 140, 60, 0.2); } to { box-shadow: 0 0 40px rgba(255, 140, 60, 0.4), 0 0 60px rgba(255, 140, 60, 0.2); } }
  `,
} as const

export const animationClasses = {
  'animate-fade-in': 'animation: fadeIn 180ms ease-out forwards;',
  'animate-fade-out': 'animation: fadeOut 180ms ease-in forwards;',
  'animate-slide-up': 'animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;',
  'animate-slide-down': 'animation: slideDown 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;',
  'animate-slide-left': 'animation: slideLeft 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;',
  'animate-slide-right': 'animation: slideRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;',
  'animate-scale-in': 'animation: scaleIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;',
  'animate-scale-out': 'animation: scaleOut 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;',
  'animate-shimmer': 'animation: shimmer 2s ease-in-out infinite;',
  'animate-pulse': 'animation: pulse 2s ease-in-out infinite;',
  'animate-spin': 'animation: spin 1s linear infinite;',
  'animate-float': 'animation: float 3s ease-in-out infinite;',
  'animate-pixel-pop': 'animation: pixelPop 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;',
  'animate-crt-flicker': 'animation: crtFlicker 0.15s infinite;',
  'animate-scanline': 'animation: scanline 8s linear infinite;',
  'animate-glow': 'animation: glow 2s ease-in-out infinite alternate;',
} as const