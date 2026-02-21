import { getDashboardStats, getRideTrends } from '@/lib/actions/admin'
import { getAllRides } from '@/lib/actions/rides'
import AdminDashboardClient from './admin-dashboard-client'
import { getLocale } from '@/lib/i18n-server'

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  const recentRides = await getAllRides(10)
  const rideTrends = await getRideTrends(7)
  const locale = await getLocale()
  const todayLabel = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ')

  return (
    <AdminDashboardClient
      stats={stats}
      recentRides={recentRides}
      rideTrends={rideTrends}
      todayLabel={todayLabel}
    />
  )
}
