import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardUI from '@/components/DashboardUI'

// It MUST say 'export default' here
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // 2. Render the Sidebar (DashboardUI) and put the page content inside it
  return (
    <DashboardUI user={user}>
      {children}
    </DashboardUI>
  )
}