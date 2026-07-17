'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { LayoutGrid, Search, User, Settings, LogOut } from 'lucide-react'
import { PixelFolderIcon } from '@/components/pixel-icons'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { label: 'Vaults', href: '/dashboard', icon: LayoutGrid, pixelIcon: PixelFolderIcon },
  { label: 'Search', href: '/search', icon: Search, pixelIcon: Search },
  { label: 'Profile', href: '/profile', icon: User, pixelIcon: User },
  { label: 'Settings', href: '/settings', icon: Settings, pixelIcon: Settings },
] as const

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  const effectiveCollapsed = isCollapsed && !isHovered

  return (
    <>
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card/60 py-4 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          effectiveCollapsed ? 'w-16' : 'w-60',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'lg:w-60 lg:translate-x-0'
        )}
        aria-label="Main navigation"
        role="navigation"
        id="app-sidebar"
      >
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 px-3 lg:px-5 transition-colors duration-200',
            'hover:bg-secondary/50 rounded-xl mx-2 lg:mx-0',
            effectiveCollapsed && 'justify-center px-2'
          )}
          aria-label="PDF-Crab Home"
          title={effectiveCollapsed ? 'PDF-Crab Home' : undefined}
        >
          <span className={cn(
            'flex size-9 items-center justify-center rounded-xl border border-border bg-card shrink-0 transition-transform duration-200',
            effectiveCollapsed && 'scale-100'
          )}>
            <PixelFolderIcon className="size-5 text-accent" />
          </span>
          <span className={cn(
            'text-sm font-semibold tracking-tight text-foreground font-brand transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            effectiveCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto lg:inline whitespace-nowrap'
          )}>
            PDF-Crab
          </span>
        </Link>

        <nav className={cn(
          'mt-8 flex flex-1 flex-col gap-1 px-2 lg:px-3 transition-all duration-300',
          effectiveCollapsed && 'px-1'
        )} aria-label="Main navigation">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.pixelIcon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  'min-h-[48px] touch-highlight relative overflow-hidden',
                  active
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  effectiveCollapsed && 'justify-center px-2'
                )}
                aria-current={active ? 'page' : undefined}
                title={effectiveCollapsed ? item.label : undefined}
              >
                <div className={cn(
                  'flex size-[20px] shrink-0 items-center justify-center transition-transform duration-200',
                  active && 'animate-pulse-soft'
                )}>
                  <Icon className={cn(
                    'size-[20px] shrink-0 transition-colors duration-200',
                    active && 'text-accent'
                  )} />
                </div>
                <span className={cn(
                  'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  effectiveCollapsed ? 'opacity-0 w-0 overflow-hidden absolute pointer-events-none' : 'opacity-100 w-auto lg:inline whitespace-nowrap'
                )}>
                  {item.label}
                </span>
                {active && !effectiveCollapsed && (
                  <span className="absolute right-2 size-1.5 rounded-full bg-accent animate-pulse-soft" aria-hidden="true" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className={cn(
          'px-2 lg:px-3 transition-all duration-300',
          effectiveCollapsed && 'px-1'
        )}>
          <button
            onClick={() => {
              handleLogout()
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'text-muted-foreground hover:bg-secondary/60 hover:text-foreground touch-highlight',
              effectiveCollapsed && 'justify-center px-2'
            )}
            title={effectiveCollapsed ? 'Log out' : undefined}
          >
            <LogOut className="size-[18px] shrink-0" />
            <span className={cn(
              'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
              effectiveCollapsed ? 'opacity-0 w-0 overflow-hidden absolute pointer-events-none' : 'opacity-100 w-auto lg:inline whitespace-nowrap'
            )}>
              Log out
            </span>
          </button>
        </div>

        {!effectiveCollapsed && window.innerWidth >= 1024 && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-border/50 hover:bg-border flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground"
            aria-label="Collapse sidebar"
            aria-expanded="true"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="15" y1="18" x2="9" y2="12" />
              <line x1="9" y1="6" x2="15" y2="12" />
            </svg>
          </button>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  )
}