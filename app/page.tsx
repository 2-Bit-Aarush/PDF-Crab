import { AppShell } from '@/components/app-shell'
import { PixelBackground } from '@/components/pixel-background'
import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { Workflow } from '@/components/workflow'
import { SiteFooter } from '@/components/site-footer'

export default function Page() {
  return (
    <AppShell>
      <main className="relative min-h-screen">
        <PixelBackground />
        <SiteHeader />
        <Hero />
        <Features />
        <Workflow />
        <SiteFooter />
      </main>
    </AppShell>
  )
}
