'use server'

import { createClient } from '@/utils/supabase/server'

// --- PASSWORD FLOW ---

// 1. Send OTP for Password Reset
export async function sendPasswordOtp(email: string) {
  const supabase = await createClient()
  // This sends an OTP to the current email
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) return { error: error.message }
  return { success: true }
}

// 2. Verify OTP and Set New Password
export async function verifyAndChangePassword(email: string, otp: string, newPassword: string) {
  const supabase = await createClient()

  // First verify the OTP (Type: Recovery)
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'recovery'
  })

  if (verifyError) return { error: verifyError.message }

  // If verified, we can now update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (updateError) return { error: updateError.message }

  return { success: true }
}

// --- EMAIL FLOW ---

// 1. Request Email Change (Sends OTP to NEW Email)
export async function requestEmailChange(newEmail: string) {
  const supabase = await createClient()
  
  // This triggers an OTP sent to the NEW email address
  const { error } = await supabase.auth.updateUser({
    email: newEmail
  })

  if (error) return { error: error.message }
  return { success: true }
}

// 2. Verify New Email OTP
export async function verifyEmailChange(newEmail: string, otp: string) {
  const supabase = await createClient()

  // Verify the OTP sent to the NEW email (Type: Email Change)
  const { error } = await supabase.auth.verifyOtp({
    email: newEmail,
    token: otp,
    type: 'email_change'
  })

  if (error) return { error: error.message }
  return { success: true }
}