'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCanvasProps {
  className?: string
  variant?: 'grid' | 'particles' | 'mesh' | 'waves' | 'dots'
  intensity?: 'subtle' | 'normal' | 'vivid'
  colorScheme?: 'warm' | 'cool' | 'mono'
  interactive?: boolean
}

type GridConfig = { lineCount: number; opacity: number; speed: number; mouseInfluence: number }
type ParticlesConfig = { count: number; size: number; opacity: number; speed: number; connectionDist: number }
type MeshConfig = { cols: number; rows: number; distortion: number; opacity: number }
type WavesConfig = { lineCount: number; amplitude: number; frequency: number; speed: number; opacity: number; colorPhase: number }
type DotsConfig = { count: number; size: number; opacity: number; speed: number }

export function AnimatedCanvas({
  className,
  variant = 'waves',
  intensity = 'vivid',
  colorScheme = 'warm',
  interactive = false,
}: AnimatedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!mounted || prefersReducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let time = 0

    const configs = {
      grid: {
        subtle: { lineCount: 20, opacity: 0.08, speed: 0.0003, mouseInfluence: 0.3 },
        normal: { lineCount: 30, opacity: 0.15, speed: 0.0005, mouseInfluence: 0.5 },
        vivid: { lineCount: 45, opacity: 0.3, speed: 0.0008, mouseInfluence: 0.7 },
      },
      particles: {
        subtle: { count: 30, size: 1.5, opacity: 0.1, speed: 0.2, connectionDist: 80 },
        normal: { count: 50, size: 2, opacity: 0.15, speed: 0.3, connectionDist: 120 },
        vivid: { count: 80, size: 2.5, opacity: 0.2, speed: 0.4, connectionDist: 180 },
      },
      mesh: {
        subtle: { cols: 15, rows: 10, distortion: 0.05, opacity: 0.08 },
        normal: { cols: 25, rows: 15, distortion: 0.08, opacity: 0.15 },
        vivid: { cols: 40, rows: 25, distortion: 0.12, opacity: 0.3 },
      },
      waves: {
        subtle: { lineCount: 12, amplitude: 30, frequency: 0.008, speed: 0.3, opacity: 0.15, colorPhase: 0 },
        normal: { lineCount: 18, amplitude: 50, frequency: 0.012, speed: 0.5, opacity: 0.25, colorPhase: 0 },
        vivid: { lineCount: 24, amplitude: 80, frequency: 0.018, speed: 0.8, opacity: 0.35, colorPhase: 0 },
      },
      dots: {
        subtle: { count: 40, size: 1, opacity: 0.08, speed: 0.0002 },
        normal: { count: 80, size: 1.5, opacity: 0.12, speed: 0.0004 },
        vivid: { count: 150, size: 2, opacity: 0.18, speed: 0.0006 },
      },
    }

    const config = (configs[variant]?.[intensity] || configs.waves.vivid) as WavesConfig

    const colors = {
      warm: {
        primary: '#ff8c3c',
        secondary: '#ff6b5b',
        tertiary: '#ffc857',
        background: '#0a0b0e',
      },
      cool: {
        primary: '#00d4aa',
        secondary: '#22d3ee',
        tertiary: '#818cf8',
        background: '#0a0b0e',
      },
      mono: {
        primary: '#ffffff',
        secondary: '#a1a1aa',
        tertiary: '#71717a',
        background: '#0a0b0e',
      },
    }

    const palette = colors[colorScheme]

    interface WaveLine {
      phase: number
      amplitude: number
      frequency: number
      speed: number
      color: string
      opacity: number
      yOffset: number
    }

    let waveLines: WaveLine[] = []

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * devicePixelRatio
      canvas.height = height * devicePixelRatio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(devicePixelRatio, devicePixelRatio)
      initWaves()
    }

    const initWaves = () => {
      waveLines = []
      const lineCount = config.lineCount
      for (let i = 0; i < lineCount; i++) {
        const progress = i / Math.max(1, lineCount - 1)
        const phaseOffset = progress * Math.PI * 4
        const amplitude = config.amplitude * (0.5 + Math.random() * 0.5)
        const frequency = config.frequency * (0.7 + Math.random() * 0.6)
        const speed = config.speed * (0.5 + Math.random() * 0.5)
        const colorIdx = Math.floor(Math.random() * 3)
        const colors = [palette.primary, palette.secondary, palette.tertiary]
        const opacity = config.opacity * (0.5 + Math.random() * 0.5)
        const yOffset = (Math.random() - 0.5) * height * 0.3

        waveLines.push({
          phase: phaseOffset,
          amplitude,
          frequency,
          speed,
          color: colors[colorIdx],
          opacity,
          yOffset,
        })
      }
    }

    const drawWaves = () => {
      if (prefersReducedMotion) return

      waveLines.forEach((wave, i) => {
        const progress = i / Math.max(1, waveLines.length - 1)
        const baseY = height / 2 + wave.yOffset
        const phase = time * wave.speed * 0.001 + wave.phase
        const color = wave.color
        const opacity = wave.opacity

        ctx.beginPath()
        ctx.moveTo(0, height)

        const segments = 60
        for (let x = 0; x <= width; x += width / segments) {
          const waveX = x * wave.frequency
          const y = baseY + Math.sin(waveX + phase) * wave.amplitude
          ctx.lineTo(x, y)
        }

        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
        ctx.closePath()

        const gradient = ctx.createLinearGradient(0, baseY - wave.amplitude, 0, baseY + wave.amplitude)
        gradient.addColorStop(0, hexToRgba(color, opacity * 0.3))
        gradient.addColorStop(0.5, hexToRgba(color, opacity))
        gradient.addColorStop(1, hexToRgba(color, opacity * 0.1))

        ctx.fillStyle = gradient
        ctx.fill()

        ctx.strokeStyle = hexToRgba(color, opacity * 0.8)
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(0, baseY)
        for (let x = 0; x <= width; x += width / segments) {
          const waveX = x * wave.frequency
          const y = baseY + Math.sin(waveX + phase) * wave.amplitude
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      })
    }

    const drawGrid = () => {
      const lineCount = (configs.grid[intensity] as GridConfig).lineCount
      const opacity = (configs.grid[intensity] as GridConfig).opacity
      const spacingX = width / (lineCount - 1)
      const spacingY = height / (lineCount - 1)

      ctx.strokeStyle = `rgba(255, 140, 60, ${opacity})`
      ctx.lineWidth = 0.5

      for (let i = 0; i < lineCount; i++) {
        const x = i * spacingX
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let i = 0; i < lineCount; i++) {
        const y = i * spacingY
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      ctx.strokeStyle = `rgba(255, 140, 60, ${opacity * 0.3})`
      ctx.lineWidth = 0.3
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.25, 0, Math.PI * 2)
      ctx.stroke()
    }

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      phase: number
      color: string
    }

    let particles: Particle[] = []

    const initParticles = () => {
      const pConfig = configs.particles[intensity] as ParticlesConfig
      particles = []
      for (let i = 0; i < pConfig.count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * pConfig.speed,
          vy: (Math.random() - 0.5) * pConfig.speed,
          size: Math.random() * pConfig.size + 0.5,
          opacity: Math.random() * pConfig.opacity + 0.02,
          phase: Math.random() * Math.PI * 2,
          color: i % 3 === 0 ? palette.primary : i % 3 === 1 ? palette.secondary : palette.tertiary,
        })
      }
    }

    const drawParticles = () => {
      const pConfig = configs.particles[intensity] as ParticlesConfig

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const pulseOpacity = p.opacity * (0.7 + Math.sin(time * 0.002 + p.phase) * 0.3)
        ctx.fillStyle = hexToRgba(p.color, pulseOpacity)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (variant === 'particles') {
          const connectionDist = pConfig.connectionDist
          if (connectionDist) {
            ctx.strokeStyle = hexToRgba(palette.primary, pConfig.opacity * 0.3)
            ctx.lineWidth = 0.3
            particles.forEach((other) => {
              if (other === p) return
              const dx = other.x - p.x
              const dy = other.y - p.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < connectionDist) {
                ctx.beginPath()
                ctx.moveTo(p.x, p.y)
                ctx.lineTo(other.x, other.y)
                ctx.stroke()
              }
            })
          }
        }
      })
    }

    const drawMesh = () => {
      const mConfig = configs.mesh[intensity] as MeshConfig
      const opacity = mConfig.opacity
      const distortion = mConfig.distortion

      ctx.strokeStyle = `rgba(255, 140, 60, ${opacity})`
      ctx.lineWidth = 0.5

      const cols = mConfig.cols
      const rows = mConfig.rows
      const cellW = width / cols
      const cellH = height / rows

      const gridPoints: { x: number; y: number; baseX: number; baseY: number; phase: number }[] = []

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          gridPoints.push({
            x: i * cellW,
            y: j * cellH,
            baseX: i * cellW,
            baseY: j * cellH,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const idx = i * (rows + 1) + j
          if (idx >= gridPoints.length) continue

          const gp = gridPoints[idx]

          if (!prefersReducedMotion) {
            gp.x = gp.baseX + Math.sin(time * 0.001 + gp.phase + i * 0.3 + j * 0.2) * cellW * distortion
            gp.y = gp.baseY + Math.cos(time * 0.001 + gp.phase + i * 0.2 + j * 0.4) * cellH * distortion
          }

          ctx.beginPath()
          ctx.arc(gp.x, gp.y, 1, 0, Math.PI * 2)
          ctx.stroke()

          if (i < cols) {
            const nextIdx = (i + 1) * (rows + 1) + j
            if (nextIdx < gridPoints.length) {
              const next = gridPoints[nextIdx]
              ctx.beginPath()
              ctx.moveTo(gp.x, gp.y)
              ctx.lineTo(next.x, next.y)
              ctx.stroke()
            }
          }

          if (j < rows) {
            const nextIdx = i * (rows + 1) + (j + 1)
            if (nextIdx < gridPoints.length) {
              const next = gridPoints[nextIdx]
              ctx.beginPath()
              ctx.moveTo(gp.x, gp.y)
              ctx.lineTo(next.x, next.y)
              ctx.stroke()
            }
          }
        }
      }
    }

    const drawDots = () => {
      if (prefersReducedMotion) return

      const dConfig = configs.dots[intensity] as DotsConfig

      if (particles.length === 0) {
        particles = []
        for (let i = 0; i < dConfig.count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * dConfig.speed * width,
            vy: (Math.random() - 0.5) * dConfig.speed * height,
            size: Math.random() * dConfig.size + 0.5,
            opacity: Math.random() * dConfig.opacity + 0.02,
            phase: Math.random() * Math.PI * 2,
            color: palette.primary,
          })
        }
      }

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const pulseOpacity = p.opacity * (0.5 + Math.sin(time * 0.001 + p.phase) * 0.5)
        ctx.fillStyle = hexToRgba(p.color, pulseOpacity)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const render = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, width, height)

      switch (variant) {
        case 'grid':
          drawGrid()
          break
        case 'particles':
          drawParticles()
          break
        case 'mesh':
          drawMesh()
          break
        case 'waves':
          drawWaves()
          break
        case 'dots':
          drawDots()
          break
      }

      time += 16
      animationRef.current = requestAnimationFrame(render)
    }

    if (variant === 'particles' || variant === 'dots') initParticles()
    if (variant === 'mesh') {} 
    if (variant === 'waves') initWaves()

    resize()
    window.addEventListener('resize', resize)
    render()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [mounted, prefersReducedMotion, variant, intensity, colorScheme, interactive])

  if (!mounted) return null

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'fixed inset-0 -z-10 pointer-events-none select-none',
        className
      )}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
      aria-hidden="true"
    />
  )
}