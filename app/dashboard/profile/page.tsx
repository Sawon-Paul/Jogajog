'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { updateProfile, deleteAccount } from '@/app/auth/profile-actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // 1. Fetch User & Profile Data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Fetch the public profile to get the avatar_url
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
          
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        }
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  // 2. Handle Image Upload
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // A. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // B. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // C. Update Profile Table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setMessage('Profile picture updated!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  // 3. Handle Text Profile Update
  const handleUpdate = async (formData: FormData) => {
    setLoading(true)
    const res = await updateProfile(formData)
    setLoading(false)
    
    if (res?.error) {
      alert(res.error)
    } else {
      // Manually update local state
      const newName = formData.get('fullName')
      const newPhone = formData.get('phone')
      const newDob = formData.get('dob')

      setUser((prevUser: any) => ({
        ...prevUser,
        user_metadata: {
          ...prevUser.user_metadata,
          full_name: newName,
          phone_number: newPhone,
          dob: newDob
        }
      }))

      // Also sync to public profiles table
      if (user) {
         await supabase.from('profiles').update({
             full_name: newName,
             phone: newPhone
         }).eq('id', user.id)
      }

      setIsEditing(false)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleDelete = async () => {
    const confirmDelete = prompt("Type 'DELETE' to confirm account deletion.")
    if (confirmDelete !== 'DELETE') return
    setLoading(true)
    const res = await deleteAccount()
    if (res?.success) router.push('/signup') 
    else { alert(res?.error); setLoading(false) }
  }

  if (loading && !user) return <div className="text-gray-500 text-center p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your personal information</p>
          </div>
          {message && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg animate-pulse">{message}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              
              {/* AVATAR CIRCLE */}
              <div className="relative w-32 h-32 mx-auto mb-4 group">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white dark:border-slate-700" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                )}

                {/* Upload Overlay (Hover) */}
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white font-bold">
                  {uploading ? '...' : 'Change'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                  />
                </label>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.user_metadata?.full_name || 'User'}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{user?.email}</p>
              
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`w-full py-2.5 rounded-xl font-semibold transition ${
                  isEditing 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                }`}
              >
                {isEditing ? 'Cancel Editing' : 'Edit Details'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20">
              <h3 className="text-red-800 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
              <button 
                onClick={handleDelete}
                className="w-full py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-600 hover:text-white transition"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Right Column: Information Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <form action={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input name="fullName" defaultValue={user?.user_metadata?.full_name} disabled={!isEditing} className="w-full bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none disabled:opacity-60" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input name="phone" defaultValue={user?.user_metadata?.phone_number} disabled={!isEditing} className="w-full bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                    <input name="dob" type="date" defaultValue={user?.user_metadata?.dob} disabled={!isEditing} className="w-full bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none disabled:opacity-60" />
                  </div>
                </div>
                {isEditing && (
                  <button className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition">Save Changes</button>
                )}
              </form>

              <div className="mt-10 pt-10 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                   <input value={user?.email} disabled className="w-full bg-gray-100 dark:bg-slate-900 border rounded-xl px-4 py-3" />
                   <input value="********" disabled type="password" className="w-full bg-gray-100 dark:bg-slate-900 border rounded-xl px-4 py-3" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}