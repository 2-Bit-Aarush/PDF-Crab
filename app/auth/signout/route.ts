import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  // Check if a user's session exists
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Clear Next.js cache for layout to force session checks
  revalidatePath('/', 'layout')

  return NextResponse.json({ success: true })
}
