'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { PixelBackground } from '@/components/pixel-background'
import { CrabCaretaker } from '@/components/mascot/crab-caretaker'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

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

        {errorMsg && (
          <div className="mt-6 rounded-[3px] border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4">
          <Button onClick={handleGoogleLogin} size="lg" className="w-full flex items-center justify-center gap-2">
            Continue with Google
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <CrabCaretaker className="mt-8 justify-center" />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Terms and Privacy apply.
        </p>
      </div>
    </main>
  )
}
