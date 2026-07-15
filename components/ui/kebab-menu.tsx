'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MenuItem = {
  label: string
  onSelect: () => void
  destructive?: boolean
}

export function KebabMenu({ items, label = 'More actions' }: { items: MenuItem[]; label?: string }) {
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

      {open ? (
        <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-[3px] border border-border bg-popover p-1 animate-slide-fade">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex w-full min-h-10 items-center rounded-[2px] px-3 text-left text-sm transition-colors duration-200',
                item.destructive
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-foreground hover:bg-secondary',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
