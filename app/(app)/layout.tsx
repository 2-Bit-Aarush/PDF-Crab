'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Search, User, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PixelFolderIcon } from '@/components/pixel-icons'
import { BottomNav } from '@/components/bottom-nav'
import { AppSidebar } from '@/components/app-sidebar'

const NAV_ITEMS = [
  { label: 'Vaults', href: '/dashboard', icon: PixelFolderIcon },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pageKey, setPageKey] = useState(0)
  const sidebarOverlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Trigger page transition on route change
  useEffect(() => {
    setPageKey(k => k + 1)
    setIsSidebarOpen(false)
  }, [pathname])

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            viewBox="0 0 64 64"
            className="size-16 text-accent animate-pulse-soft"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <ellipse cx="32" cy="42" rx="18" ry="10" />
            <ellipse cx="32" cy="35" rx="13" ry="8" />
            <path d="M14 35 Q10 28 14 24 Q18 30 14 35" />
            <path d="M50 35 Q54 28 50 24 Q46 30 50 35" />
            <path d="M18 48 Q15 52 18 54 Q22 51 18 48" />
            <path d="M46 48 Q49 52 46 54 Q42 51 46 48" />
            <circle className="crab-eye" cx="26" cy="33" r="2" fill="#08090c" />
            <circle className="crab-eye" cx="38" cy="33" r="2" fill="#08090c" />
            <circle cx="25" cy="32" r="0.5" fill="#fff" />
            <circle cx="37" cy="32" r="0.5" fill="#fff" />
          </svg>
          <p className="font-brand text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Loading archive...</p>
        </div>
      </div>
    )
  }

  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Single WorkspaceBackground at root level */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile header with hamburger */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex h-14 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex size-10 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50 touch-highlight-active"
              aria-label="Open navigation"
              aria-expanded={false}
              aria-controls="app-sidebar"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="PDF-Crab Home"
            >
              <svg
                viewBox="0 0 64 64"
                className="size-6 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <ellipse cx="32" cy="42" rx="18" ry="10" />
                <ellipse cx="32" cy="35" rx="13" ry="8" />
                <path d="M14 35 Q10 28 14 24 Q18 30 14 35" />
                <path d="M50 35 Q54 28 50 24 Q46 30 50 35" />
                <path d="M18 48 Q15 52 18 54 Q22 51 18 48" />
                <path d="M46 48 Q49 52 46 54 Q42 51 46 48" />
                <circle className="crab-eye" cx="26" cy="33" r="2" fill="#08090c" />
                <circle className="crab-eye" cx="38" cy="33" r="2" fill="#08090c" />
                <circle cx="25" cy="32" r="0.5" fill="#fff" />
                <circle cx="37" cy="32" r="0.5" fill="#fff" />
              </svg>
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                PDF<span className="text-accent">-</span>Crab
              </span>
            </Link>
          </div>
        </header>

        {/* Sidebar overlay for mobile */}
        <div
          ref={sidebarOverlayRef}
          className={cn(
            'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Desktop sidebar + mobile sidebar */}
        <AppSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 pt-14 lg:pt-0 min-h-screen" id="main-content">
          <div 
            key={pageKey}
            className="animate-slide-fade w-full"
            role="main"
          >
            {children}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppLayoutContent>{children}</AppLayoutContent>
    </div>
  )
}