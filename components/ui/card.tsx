'use client'

import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'pixel'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

function Card({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-card border border-border',
    elevated: 'bg-card border border-border shadow-lg shadow-black/30',
    outlined: 'bg-transparent border-2 border-border',
    glass: 'bg-card/60 backdrop-blur-sm border border-border/50',
    pixel: 'bg-card border-2 border-foreground relative before:absolute before:inset-0 before:border-2 before:border-accent/30 before:-translate-x-0.5 before:-translate-y-0.5 pointer-events-none',
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div
      className={cn(
        'rounded-[8px] transition-all duration-180',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props} />
  )
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-semibold text-foreground tracking-tight',
        className
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-0', className)} {...props} />
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-2 pt-2', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }