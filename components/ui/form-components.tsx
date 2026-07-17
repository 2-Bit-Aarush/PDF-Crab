'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Search, X, ChevronDown, Filter, Check } from 'lucide-react'
import { createContext, useContext, useCallback } from 'react'

interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
  showFilter?: boolean
  onFilterClick?: () => void
  className?: string
}

export function SearchBar({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  showFilter = false,
  onFilterClick,
  className,
  ...props
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      onSearch(query)
    }, debounceMs)
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, debounceMs, onSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const clear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div
      className={cn(
        'relative w-full',
        focused && 'ring-2 ring-accent/40',
        className
      )}
    >
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60 transition-colors" />
        <input
          {...props}
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            'field-input pl-10 pr-10',
            query && 'pr-10',
            focused && 'border-ring'
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            onClick={clear}
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      {showFilter && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full sm:w-auto flex items-center justify-center gap-2"
          onClick={onFilterClick}
        >
          <Filter className="size-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      )}
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  description?: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  className?: string
  searchable?: boolean
}

export function Select({
  options,
  value,
  onChange,
  label,
  error,
  hint,
  placeholder,
  className,
  searchable = false,
  ...props
}: SelectProps) {
  const selectId = useRef(`select-${Math.random().toString(36).slice(2, 9)}`).current
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="field-label">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <ChevronDown
            className={cn(
              'absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60 pointer-events-none transition-transform',
              open && 'rotate-180'
            )}
          />
          <select
            id={selectId}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(false)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
            className={cn(
              'field-input pr-10 appearance-none cursor-pointer',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/20'
            )}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

{searchable && open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1">
              <div className="card-base bg-card border border-border rounded-[8px] p-2 shadow-xl max-h-60 overflow-auto">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field-input mb-2"
                  autoFocus
                />
                {filteredOptions.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">No options found</p>
                ) : (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value)
                        setOpen(false)
                        setSearchQuery('')
                      }}
                      disabled={opt.disabled}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left text-sm rounded-[6px] transition-colors duration-150',
                        'hover:bg-secondary',
                        opt.disabled && 'opacity-40 pointer-events-none'
                      )}
                    >
                      {opt.icon && <span className="shrink-0 size-4">{opt.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{opt.label}</p>
                        {opt.description && (
                          <p className="text-[11px] text-muted-foreground truncate">{opt.description}</p>
                        )}
                      </div>
                    </button>
                  )))}
              </div>
            </div>
          )}

        {error && (
          <p className="mt-1.5 text-xs text-destructive flex items-center gap-1" role="alert">
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-xs text-muted-foreground/70">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  className?: string
  indeterminate?: boolean
}

export function Checkbox({
  className,
  label,
  description,
  indeterminate = false,
  ...props
}: CheckboxProps) {
  const checkboxId = useRef(`checkbox-${Math.random().toString(36).slice(2, 9)}`).current

  useEffect(() => {
    const input = document.getElementById(checkboxId) as HTMLInputElement
    if (input && indeterminate) {
      input.indeterminate = true
    }
  }, [indeterminate, checkboxId])

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="relative flex shrink-0">
        <input
          type="checkbox"
          id={checkboxId}
          className="peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-[4px] border border-input bg-secondary text-accent transition-all duration-150"
          checked={props.checked}
          onChange={(e) => props.onChange?.(e)}
          disabled={props.disabled}
          aria-describedby={description ? `${checkboxId}-desc` : undefined}
          {...props}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Check
            className={cn(
              'size-3.5 text-accent-foreground',
              'peer-checked:scale-100 peer-checked:opacity-100',
              'scale-0 opacity-0 transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
              indeterminate && 'peer-indeterminate:scale-100 peer-indeterminate:opacity-100'
            )}
          />
          {indeterminate && (
            <div className="absolute h-0.5 w-2 bg-accent-foreground rounded" />
          )}
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col gap-0.5 pt-0.5">
          {label && (
            <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer peer-disabled:opacity-50">
              {label}
            </label>
          )}
          {description && (
            <p id={`${checkboxId}-desc`} className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface RadioGroupProps {
  options: { value: string; label: string; description?: string; disabled?: boolean }[]
  value: string
  onChange: (value: string) => void
  className?: string
  name: string
  label?: string
  orientation?: 'horizontal' | 'vertical'
}

export function RadioGroup({
  options,
  value,
  onChange,
  className,
  name,
  label,
  orientation = 'vertical',
}: RadioGroupProps) {
  return (
    <fieldset className={cn('w-full', className)}>
      {label && <legend className="field-label">{label}</legend>}
      <div className={cn('flex gap-3', orientation === 'vertical' && 'flex-col')}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex items-center gap-3 cursor-pointer touch-highlight min-h-[44px]',
              'group relative',
              orientation === 'horizontal' && 'flex-1'
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={opt.disabled}
              className="peer h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-input bg-secondary text-accent transition-all duration-150"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={cn(
                'w-2.5 h-2.5 rounded-full bg-accent transition-all duration-150',
                'peer-checked:scale-100 peer-checked:opacity-100',
                'scale-0 opacity-0'
              )} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium text-foreground peer-disabled:opacity-50">
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              )}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  className?: string
}

export function Switch({
  className,
  label,
  description,
  ...props
}: SwitchProps) {
  const switchId = useRef(`switch-${Math.random().toString(36).slice(2, 9)}`).current

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex shrink-0">
        <input
          type="checkbox"
          id={switchId}
          role="switch"
          className="peer h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-input bg-secondary transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
          checked={props.checked}
          onChange={(e) => props.onChange?.(e)}
          disabled={props.disabled}
          aria-describedby={description ? `${switchId}-desc` : undefined}
          {...props}
        />
        <div className={cn(
          'absolute left-1 top-0.5 h-5 w-5 rounded-full bg-background shadow-md transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'peer-checked:translate-x-5 peer-checked:border-accent',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 peer-focus-visible:ring-offset-2'
        )} />
      </div>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-foreground cursor-pointer peer-disabled:opacity-50">
              {label}
            </label>
          )}
          {description && (
            <p id={`${switchId}-desc`} className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface SliderProps {
  label?: string
  min?: number
  max?: number
  step?: number
  showValue?: boolean
  valueLabel?: (value: number) => string
  value: number
  onChange: (value: number) => void
  className?: string
}

export function Slider({
  className,
  label,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  valueLabel,
  value,
  onChange,
  ...props
}: SliderProps) {
  const sliderId = useRef(`slider-${Math.random().toString(36).slice(2, 9)}`).current
  const [focused, setFocused] = useState(false)

  const percentage = ((value as number) - min) / (max - min) * 100

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label htmlFor={sliderId} className="field-label">
            {label}
          </label>
          {showValue && (
            <span className="font-brand text-sm text-accent tabular-nums">
              {valueLabel ? valueLabel(value) : `${value}`}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          id={sliderId}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-8 -ml-4 opacity-0 cursor-pointer focus-visible:opacity-100"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 size-5 rounded-full bg-accent border-2 border-accent-foreground shadow-lg pointer-events-none transition-transform duration-150',
            'opacity-0 peer-focus-visible:opacity-100 peer-hover:opacity-100',
            focused && 'opacity-100'
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    </div>
  )
}

export { Input, Textarea } from './input'