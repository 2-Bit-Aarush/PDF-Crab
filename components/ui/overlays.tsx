'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { X, ChevronDown, Filter } from 'lucide-react'

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info'
  duration?: number
  action?: { label: string; onClick: () => void }
  onClose?: () => void
}

export function Toast({
  title,
  description,
  variant = 'default',
  duration = 5000,
  action,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  const variantClasses = {
    default: 'border-border bg-card text-foreground',
    success: 'border-accent-green/30 bg-accent-green/10 text-accent-green',
    destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
    warning: 'border-accent-gold/30 bg-accent-gold/10 text-accent-gold',
    info: 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan',
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[90] w-full max-w-sm animate-slide-right',
        'flex items-start gap-3 p-4 rounded-[8px] border shadow-xl',
        variantClasses[variant]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        {description && (
          <p className="mt-1 text-sm opacity-90">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <Button
            variant="ghost"
            size="sm"
            className="text-current hover:bg-current/10"
            onClick={() => {
              action.onClick()
              setVisible(false)
              onClose?.()
            }}
          >
            {action.label}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-current/60 hover:text-current"
          onClick={() => {
            setVisible(false)
            onClose?.()
          }}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}

interface ToastContextValue {
  toast: (props: ToastProps) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t: ToastProps & { id: string }) => (
          <Toast
            key={t.id}
            {...t}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}: DrawerProps) {
  const sizes = {
    sm: 'max-w-[320px]',
    md: 'max-w-[480px]',
    lg: 'max-w-[640px]',
    xl: 'max-w-[800px]',
    full: 'max-w-[90vw]',
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full animate-slide-in flex flex-col',
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        aria-describedby={description ? 'drawer-description' : undefined}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between border-b border-border p-4">
            <div className="flex-1 pr-4">
              {title && (
                <h2 id="drawer-title" className="font-semibold text-foreground text-base">
                  {title}
                </h2>
              )}
              {description && (
                <p id="drawer-description" className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )
}

interface PopoverProps {
  open: boolean
  onClose: () => void
  trigger: React.ReactElement
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  offset?: number
}

export function Popover({
  open,
  onClose,
  trigger,
  content,
  side = 'bottom',
  align = 'start',
  offset = 8,
}: PopoverProps) {
  const triggerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!open) return <>{trigger}</>

  return (
    <>
      <span ref={triggerRef}>{trigger}</span>
      <div
        ref={contentRef}
        className={cn(
          'fixed z-50 w-72 animate-scale-in',
          'rounded-[8px] border border-border bg-card/95 backdrop-blur-sm shadow-xl',
          'p-2 overflow-hidden'
        )}
        role="dialog"
        aria-label="Popover"
      >
        {content}
      </div>
    </>
  )
}

interface TooltipProps {
  content: string
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 200,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowStyles = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-accent',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-accent',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-accent',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-accent',
  }

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'fixed z-50 px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-[4px] shadow-lg animate-fade-in',
            'whitespace-nowrap pointer-events-none',
            sideStyles[side]
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              'absolute size-2 rotate-45 bg-accent',
              arrowStyles[side]
            )}
          />
        </div>
      )}
    </div>
  )
}