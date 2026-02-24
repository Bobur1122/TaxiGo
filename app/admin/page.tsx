import Link from 'next/link'
import { getDashboardStats, getRideTrends } from '@/lib/actions/admin'
import { getAllRides, type RideRange } from '@/lib/actions/rides'
import AdminDashboardClient from './admin-dashboard-client'
import { getLocale } from '@/lib/i18n-server'
import { tServer } from '@/lib/i18n-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = { searchParams?: { range?: RideRange } }

const ranges: { key: RideRange; labelKey: string }[] = [
  { key: 'all', labelKey: 'admin.range.all' },
  { key: 'day', labelKey: 'admin.range.day' },
  { key: 'week', labelKey: 'admin.range.week' },
  { key: 'month', labelKey: 'admin.range.month' },
  { key: 'year', labelKey: 'admin.range.year' },
]

export default async function AdminDashboardPage({ searchParams }: Props) {
  const rangeParam = searchParams?.range || 'all'
  const range = ranges.some((r) => r.key === rangeParam) ? rangeParam : 'all'

  const stats = await getDashboardStats(range)
  const recentRides = await getAllRides(10, range)
  const rideTrends = await getRideTrends(7)
  const locale = await getLocale()
  const tFilter = await tServer('admin.filterBy')
  const rangeLabels = await Promise.all(ranges.map((r) => tServer(r.labelKey)))
  const todayLabel = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ')

  return (
    <>
      <div className="p-4 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{tFilter}:</span>
          {ranges.map((r, idx) => {
            const isActive = range === r.key
            return (
              <Link
                key={r.key}
                href={`/admin?range=${r.key}`}
                className={`rounded-full border px-3 py-1 transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 text-foreground hover:border-primary/50 hover:text-primary'
                }`}
              >
                {rangeLabels[idx]}
              </Link>
            )
          })}
        </div>
      </div>
      <AdminDashboardClient
        stats={stats}
        recentRides={recentRides}
        rideTrends={rideTrends}
        todayLabel={todayLabel}
      />
    </>
  )
}
