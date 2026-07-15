'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutGrid, Search, User, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { label: 'Vaults', href: '/dashboard', icon: LayoutGrid },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-border bg-card/60 py-4 backdrop-blur-sm lg:w-60">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 lg:px-5">
        <span className="flex size-9 items-center justify-center rounded-xl border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="size-5" />
        </span>
        <span className="hidden text-sm font-semibold tracking-tight text-foreground lg:inline font-brand">
          PDF-Crab
        </span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1 px-2 lg:px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-2 lg:px-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="size-[18px] shrink-0" />
          <span className="hidden lg:inline">Log out</span>
        </button>
      </div>
    </aside>
  )
}
