import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EmptyArchiveProps {
  icons: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyArchive({ icons, title, description, action, className }: EmptyArchiveProps) {
  return (
    <div className={cn('empty-archive', className)}>
      <div className="flex items-end justify-center gap-2 opacity-70">{icons}</div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground/90">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-[16rem]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
