'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  closeOnOverlayClick?: boolean
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-[320px]',
    md: 'max-w-[400px]',
    lg: 'max-w-[520px]',
    xl: 'max-w-[640px]',
    full: 'max-w-[90vw]',
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          'relative w-full rounded-[12px] border border-border bg-card/95 backdrop-blur-sm shadow-2xl animate-scale-in overflow-hidden',
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between border-b border-border p-4">
          <div className="flex-1 pr-4">
            <h2 id="modal-title" className="font-semibold text-foreground text-base">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {showClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: 'default' | 'destructive'
  loading?: boolean
}

function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
  loading = false,
}: AlertDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex flex-col gap-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export { Modal, AlertDialog }