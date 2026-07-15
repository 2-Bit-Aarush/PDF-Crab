import type { ReactNode } from 'react'
import { VaultStoreProvider } from '@/lib/vault-store'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <VaultStoreProvider>
      <div className="min-h-screen pb-20 animate-slide-fade bg-workspace-calm">
        <main className="w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </VaultStoreProvider>
  )
}
