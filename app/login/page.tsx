'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { CrabCaretaker } from '@/components/mascot/crab-caretaker'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('')
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error_description') || params.get('error')
    if (err) {
      setErrorMsg(decodeURIComponent(err))
    }
  }, [])

  async function handleGoogleLogin() {
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setErrorMsg(err.message || 'Google OAuth failed to start.')
    }
  }

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 bg-background">
      </main>
    )
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm animate-slide-fade">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="size-6 text-accent" />
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            PDF<span className="text-accent">-</span>Crab
          </span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Enter the archive
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your vaults and master notes.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-[8px] border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive animate-slide-fade" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <Button onClick={handleGoogleLogin} size="lg" className="w-full flex items-center justify-center gap-2">
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <CrabCaretaker className="mt-10 justify-center" />

        <p className="mt-8 text-center text-xs text-muted-foreground/70">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  )
}