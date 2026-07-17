'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { PixelCrabIcon } from '@/components/pixel-icons'
import { cn } from '@/lib/utils'
import { Search, Menu, X } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  external?: boolean
  cta?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'GitHub', href: 'https://github.com', external: true },
  { label: 'Get Started', href: '/login', cta: true },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const handleGetStarted = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/login') {
      e.preventDefault()
      window.location.href = '/login'
    }
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 px-4 py-3 md:py-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        isScrolled && 'bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm'
      )}
      role="banner"
    >
      <div className="mx-auto max-w-full flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="PDF-Crab Home"
        >
          <PixelCrabIcon className="size-6 text-accent" />
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            PDF<span className="text-accent">-</span>Crab
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative px-3 py-1.5 text-xs font-semibold uppercase tracking-wider',
                'rounded-[4px] transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)]',
                'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                item.external && 'cursor-pointer'
              )}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              aria-label={item.label}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {item.label}
              {!item.external && (
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-accent transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] -translate-x-1/2 hover:w-full" aria-hidden="true" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            onClick={handleGetStarted}
            className={cn(
              'hidden md:inline-flex items-center justify-center gap-2',
              'h-10 px-4 rounded-[6px]',
              'bg-gradient-to-br from-accent to-primary text-accent-foreground',
              'font-semibold text-sm',
              'shadow-sm hover:shadow-md hover:from-accent/90 hover:to-primary/90',
              'active:scale-[0.98] transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)]'
            )}
          >
            Get Started
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={cn(
          'md:hidden absolute top-full left-0 right-0',
          'bg-background/98 backdrop-blur-md border-b border-border',
          'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isMobileMenuOpen ? 'opacity-100 max-h-96 p-4' : 'opacity-0 max-h-0 p-0 pointer-events-none'
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'px-4 py-3 text-sm font-medium rounded-[8px] transition-all duration-180',
                'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                item.external && 'cursor-pointer',
                item.cta && 'bg-gradient-to-r from-accent to-primary text-accent-foreground font-semibold mx-4 mt-2 rounded-[8px] text-center'
              )}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              aria-label={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {!isMobileMenuOpen ? null : (
          <div className="pt-4 border-t border-border/30" aria-hidden="true" />
        )}
      </div>
    </header>
  )
}

function handleGetStarted(e: React.MouseEvent<HTMLAnchorElement>) {
  if (window.location.pathname !== '/login') {
    e.preventDefault()
    window.location.href = '/login'
  }
}