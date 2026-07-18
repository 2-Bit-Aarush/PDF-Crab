'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VisualAsset {
  id: string
  imageUrl: string
  subType: string
  source?: string
  width?: number
  height?: number
  mimeType?: string
}

interface SourceEvidenceCardProps {
  assets: VisualAsset[]
}

export function SourceEvidenceCard({ assets }: SourceEvidenceCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoomScale, setZoomScale] = useState(1)

  // Keyboard navigation & Android Back gesture support inside gallery
  useEffect(() => {
    if (!isOpen) return

    // Push a dummy state to history to capture back gesture
    window.history.pushState({ galleryOpen: true }, '')

    const handlePopState = () => {
      setIsOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'Escape') {
        window.history.back()
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
      // Clean up history state if closed manually
      if (window.history.state?.galleryOpen) {
        window.history.back()
      }
    }
  }, [isOpen, currentIndex])

  const handlePrev = () => {
    setZoomScale(1)
    setCurrentIndex((prev) => (prev === 0 ? assets.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setZoomScale(1)
    setCurrentIndex((prev) => (prev === assets.length - 1 ? 0 : prev + 1))
  }

  const handleZoomToggle = () => {
    setZoomScale((prev) => (prev === 1 ? 2.2 : 1))
  }

  const currentAsset = assets[currentIndex]

  return (
    <div className="mt-3.5 mb-2.5">
      {/* Evidence Preview Card */}
      <div className="border border-border bg-card/40 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm hover:border-accent/40 transition-colors duration-200">
        
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 bg-accent rounded-full animate-pulse" />
            <h4 className="text-xs font-semibold text-foreground tracking-tight">Source Evidence</h4>
            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
              {assets.length} {assets.length === 1 ? 'snippet' : 'snippets'}
            </span>
          </div>
          
          <button
            onClick={() => {
              setCurrentIndex(0)
              setIsOpen(true)
            }}
            className="text-[11px] font-semibold text-accent hover:text-accent/80 hover:underline flex items-center gap-1 cursor-pointer transition-colors duration-150"
          >
            <Eye className="size-3" />
            View All
          </button>
        </div>

        {/* Thumbnail Preview Grid */}
        <div className="grid grid-cols-4 gap-2">
          {assets.slice(0, 4).map((asset, idx) => (
            <div
              key={asset.id || idx}
              onClick={() => {
                setCurrentIndex(idx)
                setIsOpen(true)
              }}
              className="relative aspect-video bg-secondary/40 rounded border border-border/50 overflow-hidden cursor-pointer group"
            >
              <img
                src={asset.imageUrl || (asset as any).localPath || (asset as any).signedUrl || (asset as any).publicUrl}
                alt={asset.subType || 'Evidence crop'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Fallback for failed image thumbnail load
                  e.currentTarget.style.display = 'none'
                }}
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="text-[9px] font-semibold text-white bg-black/60 px-1 rounded-sm">
                  {asset.subType}
                </span>
              </div>
            </div>
          ))}

          {/* Remaining assets indicator */}
          {assets.length > 4 && (
            <div
              onClick={() => {
                setCurrentIndex(4)
                setIsOpen(true)
              }}
              className="relative aspect-video bg-accent/10 border border-accent/20 rounded flex items-center justify-center cursor-pointer hover:bg-accent/15 transition-colors duration-200"
            >
              <span className="text-xs font-bold text-accent">
                +{assets.length - 4} more
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Interactive Gallery Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background/98 select-none">
            
            {/* Header toolbar */}
            <div className="h-14 px-4 border-b border-border/50 flex items-center justify-between bg-card/60 backdrop-blur-md">
              <div className="min-w-0 pr-4">
                <h3 className="text-xs font-bold text-foreground truncate">
                  Evidence Gallery
                </h3>
                <p className="text-[10px] text-muted-foreground truncate">
                  Snippet {currentIndex + 1} of {assets.length} · {currentAsset?.subType || 'Visual Snippet'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom control */}
                <button
                  onClick={handleZoomToggle}
                  title="Toggle Zoom"
                  className="p-2 text-muted-foreground hover:text-foreground rounded hover:bg-secondary/40 transition-colors duration-150 cursor-pointer"
                >
                  {zoomScale === 1 ? <ZoomIn className="size-4.5" /> : <ZoomOut className="size-4.5" />}
                </button>

                {/* Original resolution download */}
                {currentAsset && (
                  <a
                    href={currentAsset.imageUrl || (currentAsset as any).localPath || (currentAsset as any).signedUrl || (currentAsset as any).publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open Original Image"
                    className="p-2 text-muted-foreground hover:text-foreground rounded hover:bg-secondary/40 transition-colors duration-150 flex items-center"
                  >
                    <Download className="size-4.5" />
                  </a>
                )}

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded hover:bg-secondary/40 transition-colors duration-150 cursor-pointer"
                >
                  <X className="size-4.5" />
                </button>
              </div>
            </div>

            {/* Gallery Image Body */}
            <div 
              onClick={() => setIsOpen(false)}
              className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/40 p-4 cursor-pointer"
            >
              
              {/* Previous Button */}
              {assets.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrev()
                  }}
                  className="absolute left-4 z-10 p-2.5 rounded-full bg-card/75 border border-border/50 text-foreground hover:bg-card hover:scale-105 transition-all duration-200 cursor-pointer shadow"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}

              {/* Central Image Canvas with Framer Motion zoom/swipe transitions */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-full max-h-[70vh] flex items-center justify-center overflow-auto p-2 scrollbar-none cursor-default"
              >
                <motion.img
                  key={currentAsset?.id || currentIndex}
                  src={currentAsset?.imageUrl || (currentAsset as any)?.localPath || (currentAsset as any)?.signedUrl || (currentAsset as any)?.publicUrl}
                  alt={currentAsset?.subType || 'Evidence image'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: zoomScale }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={cn(
                    'max-w-[90vw] max-h-[65vh] object-contain rounded border border-border bg-card shadow-md transition-transform duration-200',
                    zoomScale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomToggle()
                  }}
                />
              </div>

              {/* Next Button */}
              {assets.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  className="absolute right-4 z-10 p-2.5 rounded-full bg-card/75 border border-border/50 text-foreground hover:bg-card hover:scale-105 transition-all duration-200 cursor-pointer shadow"
                >
                  <ChevronRight className="size-5" />
                </button>
              )}

            </div>

            {/* Footer Metadata Drawer */}
            <div className="p-4 border-t border-border/50 bg-card/60 backdrop-blur-md flex flex-col gap-1.5 text-center sm:text-left">
              <span className="font-brand text-[9px] text-accent uppercase tracking-wider font-semibold">
                Original source citation
              </span>
              <p className="text-sm font-medium text-foreground">
                {currentAsset?.source || 'Linked from source documents'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Type: {currentAsset?.subType || 'Source image crop'} · Preserved for visual scientific accuracy
              </p>
            </div>

          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
