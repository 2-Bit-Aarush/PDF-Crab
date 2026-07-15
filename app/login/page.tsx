'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { PixelBackground } from '@/components/pixel-background'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-background">
      <PixelBackground opacity={0.06} />
      <div className="w-full max-w-sm animate-slide-fade">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="size-5" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            PDF-Crab
          </span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continue to your knowledge workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-lg border border-input bg-secondary px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/45 transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-lg border border-input bg-secondary px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/45 transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-2 h-12 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              Sign In
              <ArrowRight className="size-4.5" />
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground tracking-wide">
          By signing in you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </main>
  )
}
