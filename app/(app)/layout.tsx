import type { ReactNode } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { CrabCaretaker } from '@/components/mascot/crab-caretaker'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 animate-slide-fade bg-workspace-calm flex flex-col justify-between">
      <main className="w-full flex-1">
        {children}
      </main>
      <div className="mx-auto w-full max-w-md px-5 pb-6">
        <hr className="pixel-divider mb-6" />
        <CrabCaretaker />
      </div>
      <BottomNav />
    </div>
  )
}
