'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// 1. SIGNUP FUNCTION
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string
  const dob = formData.get('dob') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phone,
        dob: dob,
      },
    },
  })

  if (error) {
    console.error('Signup Error:', error)
    return redirect('/signup?error=Could not authenticate user')
  }

  return redirect('/verify-otp?email=' + email)
}

// 2. LOGIN FUNCTION
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login Error:', error)
    return redirect('/login?error=Invalid login credentials')
  }

  return redirect('/dashboard')
}

// 3. SEND MESSAGE FUNCTION (This was missing!)
export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  
  const content = formData.get('content') as string
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  // Insert the message
  await supabase.from('messages').insert({
    content,
    user_id: user.id,
    user_name: user.user_metadata.full_name || user.email?.split('@')[0]
  })
}