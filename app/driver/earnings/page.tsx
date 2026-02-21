import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatUZS } from '@/lib/map-utils'
import { TrendingUp, DollarSign, Car } from 'lucide-react'
import { getLocale, tServer } from '@/lib/i18n-server'

export default async function DriverEarningsPage() {
  const [
    tEarnings,
    tToday,
    tRides,
    tThisWeek,
    tTotalRides,
    tRecentRides,
  ] = await Promise.all([
    tServer('driver.earnings'),
    tServer('admin.today'),
    tServer('admin.rides'),
    tServer('admin.thisWeek'),
    tServer('admin.totalRides'),
    tServer('admin.recentRides'),
  ])
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rides } = await supabase
    .from('rides')
    .select('fare_final, completed_at, created_at')
    .eq('driver_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  const allRides = rides || []
  const totalEarnings = allRides.reduce((sum, r) => sum + (r.fare_final || 0), 0)

  const today = new Date()
  const todayRides = allRides.filter(r => new Date(r.completed_at || r.created_at).toDateString() === today.toDateString())
  const todayEarnings = todayRides.reduce((sum, r) => sum + (r.fare_final || 0), 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekRides = allRides.filter(r => new Date(r.completed_at || r.created_at) >= weekAgo)
  const weekEarnings = weekRides.reduce((sum, r) => sum + (r.fare_final || 0), 0)

  return (
    <div className="p-4 lg:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{tEarnings}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" /> {tToday}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatUZS(todayEarnings)}</p>
            <p className="text-xs text-muted-foreground">{todayRides.length} {tRides}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> {tThisWeek}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatUZS(weekEarnings)}</p>
            <p className="text-xs text-muted-foreground">{weekRides.length} {tRides}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Car className="h-4 w-4" /> {tTotalRides}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatUZS(totalEarnings)}</p>
            <p className="text-xs text-muted-foreground">{allRides.length} {tRides}</p>
          </CardContent>
        </Card>
      </div>

      {allRides.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-foreground">{tRecentRides}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allRides.slice(0, 15).map((ride, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">
                    {new Date(ride.completed_at || ride.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-medium text-foreground">{formatUZS(ride.fare_final || 0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
