'use client'

import { useEffect } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center px-4 pb-24 sm:items-center sm:pb-0 animate-slide-fade"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/70 transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-[3px] border border-border bg-card p-5">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
