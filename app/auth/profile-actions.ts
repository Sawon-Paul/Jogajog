'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js' // You might need to install this if you haven't
import { redirect } from 'next/navigation'

// 1. UPDATE BASIC INFO
export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string
  const dob = formData.get('dob') as string

  // Update Auth Metadata (User Table)
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone_number: phone, dob: dob }
  })

  // Update Profiles Table (Public Table)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone_number: phone, dob: dob })
      .eq('id', user.id)
  }

  if (authError) return { error: authError.message }
  
  return { success: true }
}

// 2. INITIATE PASSWORD RESET (Sends OTP/Link)
export async function initiatePasswordReset(email: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/dashboard/profile/reset-password', // We will make this page
  })

  if (error) return { error: error.message }
  return { success: true }
}

// 3. DELETE ACCOUNT (Requires Admin Privileges)
// Note: To make this work, you need your SERVICE_ROLE_KEY in .env.local
export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not logged in' }

  // Create an Admin Client to delete the user
  const adminAuthClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ADD THIS TO YOUR .ENV FILE
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { error } = await adminAuthClient.auth.admin.deleteUser(user.id)

  if (error) return { error: error.message }
  return { success: true }
}