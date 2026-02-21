import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DriverShell from './driver-shell'
import { tServer } from '@/lib/i18n-server'

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const role = user.user_metadata?.role
  if (role !== 'driver') redirect(`/${role || 'customer'}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const tDefaultName = await tServer('driver.defaultName')

  return (
    <DriverShell userName={profile?.full_name || user.email || tDefaultName}>
      {children}
    </DriverShell>
  )
}
