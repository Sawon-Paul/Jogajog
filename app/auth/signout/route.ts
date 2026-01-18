import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Redirect to the home page (or login page)
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}