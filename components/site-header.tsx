'use client'

import { useRouter } from 'next/navigation'
import PillNav from '@/components/PillNav'

const items = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'GitHub', href: 'https://github.com', ariaLabel: 'GitHub repository' },
  { label: 'Get Started', href: '#get-started' },
]

export function SiteHeader() {
  const router = useRouter()

  // PillNav renders hash hrefs as plain anchors. Intercept the "Get Started"
  // pill and route to /login without modifying the PillNav component.
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (href === '#get-started') {
      e.preventDefault()
      router.push('/login')
    }
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
      <div className="pointer-events-auto mt-4" onClick={handleClick}>
        <PillNav
          logo="/logo.svg"
          logoAlt="PDF-Crab"
          items={items}
          activeHref="#home"
          baseColor="#0e0f13"
          pillColor="#1c2029"
          pillTextColor="#f5f5f5"
          hoveredPillTextColor="#ffffff"
          onMobileMenuClick={() => {}}
        />
      </div>
    </header>
  )
}
