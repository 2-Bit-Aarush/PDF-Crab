'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  PixelCrabIcon,
  PixelFolderIcon,
  PixelMasterNoteIcon,
  PixelDocIcon,
} from '@/components/pixel-icons'
import { PixelProgress } from '@/components/pixel-progress'

interface CrabLoadingAnimationProps {
  uploadState: 'idle' | 'uploading' | 'compiling' | 'success'
  uploadProgress: number
  uploadCurrentFile: number
  uploadTotalFiles: number
  uploadFileName: string
  currentPhaseText: string
  compilingPhase: number
  compilingPhases: readonly { readonly label: string; readonly progress: number }[]
  onMinimize?: () => void
  sourcesCount?: number
  pagesCount?: number
  topicsCount?: number
  snippetsCount?: number
}

export function CrabLoadingAnimation({
  uploadState,
  uploadProgress,
  uploadCurrentFile,
  uploadTotalFiles,
  uploadFileName,
  currentPhaseText,
  compilingPhase,
  compilingPhases,
  onMinimize,
  sourcesCount = 0,
  pagesCount = 0,
  topicsCount = 0,
  snippetsCount = 0,
}: CrabLoadingAnimationProps) {
  const [crabX, setCrabX] = useState(-110)
  const [isCarrying, setIsCarrying] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [pose, setPose] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [showGlow, setShowGlow] = useState(false)

  // Alternate walking claws pose
  useEffect(() => {
    if (uploadState === 'idle') return

    const poseInterval = setInterval(() => {
      setPose((p) => {
        // Let the crab wave claws briefly or look/blink
        if (Math.random() < 0.1) return 'D' // Look right
        return p === 'B' ? 'C' : 'B'
      })
    }, uploadState === 'success' ? 90 : 180)

    return () => clearInterval(poseInterval)
  }, [uploadState])

  // Horizontal walking loop for uploading & compiling
  useEffect(() => {
    if (uploadState === 'idle' || uploadState === 'success') return

    let active = true
    let startTime = Date.now()
    const tripDuration = 2200 // ms per trip
    const pauseDuration = 300 // ms pause at each folder

    function animate() {
      if (!active) return

      const elapsed = Date.now() - startTime
      const cycleLength = (tripDuration + pauseDuration) * 2
      const pos = elapsed % cycleLength

      if (pos < tripDuration) {
        // Left to Right
        const progress = pos / tripDuration
        setCrabX(-110 + progress * 220)
        setIsCarrying(true)
        setIsFlipped(false)
      } else if (pos < tripDuration + pauseDuration) {
        // Pause at Right (deposit)
        setCrabX(110)
        setIsCarrying(false)
        setIsFlipped(false)
      } else if (pos < tripDuration + pauseDuration + tripDuration) {
        // Right to Left
        const progress = (pos - (tripDuration + pauseDuration)) / tripDuration
        setCrabX(110 - progress * 220)
        setIsCarrying(false)
        setIsFlipped(true)
      } else {
        // Pause at Left (pickup)
        setCrabX(-110)
        setIsCarrying(true)
        setIsFlipped(true)
      }

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)

    return () => {
      active = false
    }
  }, [uploadState])

  // Success flow animation
  useEffect(() => {
    if (uploadState !== 'success') {
      setShowGlow(false)
      return
    }

    let active = true
    let startTime = Date.now()
    const tripDuration = 1400

    function animate() {
      if (!active) return
      const elapsed = Date.now() - startTime

      if (elapsed < tripDuration) {
        // Carry success notebook to right folder
        const progress = elapsed / tripDuration
        setCrabX(-110 + progress * 220)
        setIsCarrying(true)
        setIsFlipped(false)
      } else if (elapsed < tripDuration + 300) {
        // Deposit
        setCrabX(110)
        setIsCarrying(false)
        setIsFlipped(false)
        setShowGlow(true)
      } else {
        // Raise one claw briefly (Pose B) and look right
        setCrabX(70)
        setPose('B')
        setIsCarrying(false)
        setIsFlipped(false)
      }

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)

    return () => {
      active = false
    }
  }, [uploadState])

  if (uploadState === 'idle') return null

  // Determine what the crab is carrying based on compiling phase
  const getCarriedItem = () => {
    if (uploadState === 'success') {
      return (
        <div className="relative animate-pulse">
          <PixelMasterNoteIcon className="size-3.5 text-amber-500 fill-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
        </div>
      )
    }

    // 0: Preparing OCR -> carries a small document
    if (compilingPhase === 0) {
      return <PixelDocIcon className="size-3 text-foreground/80 fill-current" />
    }
    // 1: Reading Pages -> carries a magnifying glass
    if (compilingPhase === 1) {
      return (
        <svg viewBox="0 0 16 16" className="size-3.5 text-blue-400 fill-none stroke-current stroke-2 -translate-y-0.5">
          <circle cx="6" cy="6" r="4" />
          <line x1="9" y1="9" x2="14" y2="14" />
        </svg>
      )
    }
    // 2: Understanding Notes -> carries a notebook
    if (compilingPhase === 2) {
      return <PixelMasterNoteIcon className="size-3 text-accent fill-current" />
    }
    // 3: Connecting Topics -> surrounded by connection nodes (rendered around container)
    if (compilingPhase === 3) {
      return <PixelDocIcon className="size-3 text-zinc-300 fill-current" />
    }
    // 4: Generating Notebook -> carries the completed notebook
    if (compilingPhase === 4) {
      return <PixelMasterNoteIcon className="size-3.5 text-amber-500 fill-amber-500" />
    }

    return <PixelDocIcon className="size-3 text-foreground/85 fill-current" />
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/96 backdrop-blur-md px-6 animate-slide-fade">
      
      {/* Hide Animation button */}
      {onMinimize && uploadState !== 'success' && (
        <button
          onClick={onMinimize}
          className="absolute top-5 right-5 px-3.5 py-1.5 bg-secondary/50 hover:bg-secondary border border-border text-[11px] font-semibold rounded-full text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-150"
        >
          Hide Animation
        </button>
      )}

      <div className="w-full max-w-sm flex flex-col gap-6">
        
        {/* Animated Scene */}
        <div className="relative h-24 flex items-center justify-between border-b border-border/20 px-8">
          
          {/* Left Folder (Sources) */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className="p-2 bg-secondary/30 rounded border border-border/50">
              <PixelFolderIcon className="size-8 text-accent/70" />
            </div>
            <span className="font-brand text-[9px] text-muted-foreground uppercase tracking-wider">
              Sources
            </span>
          </div>

          {/* Dotted walking track */}
          <div className="absolute left-16 right-16 top-1/2 -translate-y-4 h-0.5 border-t border-dashed border-border/40" />

          {/* Walking Crab Container */}
          <div className="absolute inset-x-16 top-1/2 -translate-y-4 flex items-center justify-center">
            <div
              style={{ transform: `translateX(${crabX}px)` }}
              className="relative transition-transform duration-75 ease-linear"
            >
              <div style={{ transform: `scaleX(${isFlipped ? -1 : 1})` }}>
                <PixelCrabIcon
                  state={uploadState === 'success' ? 'default' : 'compiling'}
                  pose={pose}
                  className="size-8 text-accent shrink-0"
                />
              </div>

              {/* Carried items based on compiling phase */}
              <AnimatePresence>
                {isCarrying && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute -top-3 left-2.5 z-20"
                  >
                    {getCarriedItem()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Orbiting nodes during Connecting Topics */}
              {uploadState === 'compiling' && compilingPhase === 3 && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  <motion.span
                    className="absolute size-1.5 bg-blue-400 rounded-full shadow-[0_0_6px_#60a5fa] -left-2 -top-2"
                    animate={{ x: [0, 8, -4, 0], y: [0, -8, -4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <motion.span
                    className="absolute size-1.5 bg-accent rounded-full shadow-[0_0_6px_#f43f5e] -right-2 -top-1"
                    animate={{ x: [0, -6, 4, 0], y: [0, -6, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Folder (Master Notebook) */}
          <motion.div
            animate={
              showGlow
                ? {
                    scale: [1, 1.12, 1],
                    rotate: [0, -3, 3, 0],
                  }
                : {}
            }
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10 flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                'p-2 bg-secondary/30 rounded border transition-all duration-300 relative',
                showGlow
                  ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'border-border/50'
              )}
            >
              <PixelMasterNoteIcon
                className={cn(
                  'size-8 transition-colors duration-300',
                  showGlow ? 'text-amber-500 fill-amber-500' : 'text-accent/70'
                )}
              />

              {/* Stacking pages animation inside folder */}
              <AnimatePresence>
                {uploadState === 'compiling' && (
                  <div className="absolute inset-x-0 bottom-1.5 flex flex-col-reverse items-center gap-[1px] pointer-events-none px-1.5">
                    {Array.from({ length: Math.min(4, compilingPhase + 1) }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scaleX: 0.8 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-[2px] bg-zinc-400 dark:bg-zinc-500 rounded-sm"
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
            <span className="font-brand text-[9px] text-muted-foreground uppercase tracking-wider">
              Notebook
            </span>
          </motion.div>

        </div>

        {/* Dynamic Status / Progress Info */}
        <div className="flex flex-col gap-4 text-center">
          
          {uploadState === 'uploading' ? (
            // Uploading Info View
            <div className="flex flex-col gap-2.5 animate-slide-fade">
              <h2 className="text-base font-bold text-foreground tracking-tight">Uploading Sources</h2>
              <div className="flex flex-col border border-border bg-card/30 p-4 rounded-lg text-left gap-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>File:</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]" title={uploadFileName}>
                    {uploadFileName}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Files uploaded:</span>
                  <span className="font-medium text-foreground">{uploadCurrentFile} / {uploadTotalFiles}</span>
                </div>
                {/* Overall Progress Bar */}
                <div className="mt-2.5">
                  <PixelProgress value={uploadProgress} maxBlocks={10} className="text-[11px]" />
                </div>
              </div>
            </div>
          ) : uploadState === 'success' ? (
            // Success summary view
            <div className="flex flex-col gap-3 animate-slide-fade">
              <div className="flex flex-col gap-3 text-left border border-border bg-card/40 p-4 rounded-lg">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest font-brand">
                  Notebook Assembled
                </h3>
                <ul className="flex flex-col gap-2 text-xs text-foreground/80 mt-1">
                  <li className="flex justify-between border-b border-border/10 pb-1.5">
                    <span>Sources Processed</span>
                    <span className="font-semibold text-foreground">{sourcesCount}</span>
                  </li>
                  <li className="flex justify-between border-b border-border/10 pb-1.5">
                    <span>Pages Processed</span>
                    <span className="font-semibold text-foreground">{pagesCount}</span>
                  </li>
                  <li className="flex justify-between border-b border-border/10 pb-1.5">
                    <span>Topics Organized</span>
                    <span className="font-semibold text-foreground">{topicsCount}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Visual Snippets Preserved</span>
                    <span className="font-semibold text-foreground">{snippetsCount}</span>
                  </li>
                </ul>
                <div className="mt-2.5 pt-3 border-t border-border/20 text-center font-brand text-xs text-accent uppercase tracking-wider font-semibold animate-pulse">
                  Ready to study.
                </div>
              </div>
            </div>
          ) : (
            // Compilation Info View (Active Compiling)
            <div className="flex flex-col gap-3.5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-brand">
                Compiling Master Note
              </h2>
              
              <div className="flex flex-col gap-2.5 text-left border border-border/40 bg-card/10 p-4 rounded-lg">
                {compilingPhases.map((phase, idx) => {
                  const isCompleted = idx < compilingPhase
                  const isActive = idx === compilingPhase && uploadState === 'compiling'

                  // Dynamic text display for "Reading Pages"
                  let labelToShow = phase.label
                  if (phase.label === 'Reading Pages') {
                    if (isActive && currentPhaseText) {
                      labelToShow = currentPhaseText
                    } else if (isCompleted) {
                      labelToShow = 'Pages Read'
                    }
                  }

                  return (
                    <div
                      key={phase.label}
                      className={cn(
                        'flex items-center justify-between text-xs transition-opacity duration-200',
                        isCompleted
                          ? 'text-green-600 dark:text-green-400 font-medium'
                          : isActive
                            ? 'text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-muted-foreground/35'
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <span className="text-[10px]">✓</span>
                        ) : isActive ? (
                          <span className="animate-pulse size-1.5 bg-blue-500 rounded-full shrink-0" />
                        ) : (
                          <span className="size-1.5 bg-transparent rounded-full shrink-0" />
                        )}
                        {labelToShow}
                      </span>
                      {isActive && (
                        <PixelProgress value={phase.progress} maxBlocks={8} className="text-[10px]" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center font-brand text-[9px] text-muted-foreground/50 tracking-widest uppercase">
          pdf-crab · build 1.0.0
        </p>

      </div>
    </div>
  )
}
