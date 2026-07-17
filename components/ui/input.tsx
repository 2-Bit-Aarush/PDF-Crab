'use client'

import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Input({
  className,
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'flex h-11 w-full rounded-[6px] border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-[color,box-shadow,border-color] duration-180 outline-none',
            'focus:border-ring focus:ring-2 focus:ring-ring/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
            'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-destructive flex items-center gap-1" role="alert">
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

function Textarea({
  className,
  label,
  error,
  hint,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`
  const errorId = `${textareaId}-error`
  const hintId = `${textareaId}-hint`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-xs font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'flex min-h-[100px] w-full rounded-[6px] border border-input bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-[color,box-shadow,border-color] duration-180 outline-none resize-y',
          'focus:border-ring focus:ring-2 focus:ring-ring/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-destructive flex items-center gap-1" role="alert">
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  )
}

export { Input, Textarea }