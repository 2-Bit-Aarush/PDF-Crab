'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { PixelBackground } from '@/components/pixel-background'
import { CrabCaretaker } from '@/components/mascot/crab-caretaker'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 bg-background">
      <PixelBackground opacity={0.05} />
      <div className="w-full max-w-sm animate-slide-fade">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="size-8" />
          <span className="font-brand text-xl font-semibold tracking-tight text-foreground">
            PDF-Crab
          </span>
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Enter the archive</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to reach your vaults and master notes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field-input"
            />
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full">
            Enter Archive
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <CrabCaretaker className="mt-8 justify-center" />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Terms and Privacy apply.
        </p>
      </div>
    </main>
  )
}
