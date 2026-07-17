'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MenuItem = {
  label: string
  onSelect: () => void
  destructive?: boolean
  icon?: React.ReactNode
  disabled?: boolean
}

interface KebabMenuProps {
  items: MenuItem[]
  label?: string
  triggerIcon?: React.ComponentType<{ className?: string }>
}

export function KebabMenu({
  items,
  label = 'More actions',
  triggerIcon = MoreHorizontal,
}: KebabMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex size-10 min-h-10 min-w-10 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground touch-highlight-active"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 w-44 origin-top-right rounded-[10px] border border-border bg-card/95 backdrop-blur-sm shadow-xl animate-scale-in p-1">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!item.disabled) {
                  setOpen(false)
                  item.onSelect()
                }
              }}
              disabled={item.disabled}
              className={cn(
                'flex w-full min-h-[44px] items-center gap-2.5 rounded-[8px] px-3 text-left text-sm font-medium transition-all duration-150',
                item.disabled
                  ? 'opacity-40 pointer-events-none'
                  : item.destructive
                    ? 'text-destructive hover:bg-destructive/10 active:bg-destructive/15'
                    : 'text-foreground hover:bg-secondary/50 active:bg-secondary'
              )}
            >
              {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface DropdownMenuProps {
  items: MenuItem[]
  children: React.ReactElement
  align?: 'left' | 'right'
}

export function DropdownMenu({
  items,
  children,
  align = 'right',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        },
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      }) : children}
      {open && (
        <div
          className={cn(
            'absolute top-full z-20 mt-1.5 w-44 origin-top rounded-[10px] border border-border bg-card/95 backdrop-blur-sm shadow-xl animate-scale-in p-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!item.disabled) {
                  setOpen(false)
                  item.onSelect()
                }
              }}
              disabled={item.disabled}
              className={cn(
                'flex w-full min-h-[44px] items-center gap-2.5 rounded-[8px] px-3 text-left text-sm font-medium transition-all duration-150',
                item.disabled
                  ? 'opacity-40 pointer-events-none'
                  : item.destructive
                    ? 'text-destructive hover:bg-destructive/10 active:bg-destructive/15'
                    : 'text-foreground hover:bg-secondary/50 active:bg-secondary'
              )}
            >
              {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}