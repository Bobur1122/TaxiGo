import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { MapPinned, History, Car } from 'lucide-react'
import { formatUZS } from '@/lib/map-utils'
import { getLocale, tServer } from '@/lib/i18n-server'

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const allRides = rides || []
  const activeRide = allRides.find((r) =>
    ['pending', 'accepted', 'arriving', 'in_progress'].includes(r.status),
  )
  const completedCount = allRides.filter(
    (r) => r.status === 'completed',
  ).length
  const totalSpent = allRides
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.fare_final || r.fare_estimate || 0), 0)

  const [
    tBookTitle,
    tBookDesc,
    tHistoryTitle,
    tHistoryDesc,
    tTotalRides,
    tCompleted,
    tTotalSpent,
    tActiveRide,
    tStatus,
    tPickup,
    tDropoff,
    tTrackRide,
    tRecentRides,
  ] = await Promise.all([
    tServer('customer.quick.bookTitle'),
    tServer('customer.quick.bookDesc'),
    tServer('customer.quick.historyTitle'),
    tServer('customer.quick.historyDesc'),
    tServer('customer.stats.totalRides'),
    tServer('customer.stats.completed'),
    tServer('customer.stats.totalSpent'),
    tServer('rides.active'),
    tServer('admin.status'),
    tServer('rides.pickup'),
    tServer('rides.dropoff'),
    tServer('rides.track'),
    tServer('rides.recent'),
  ])
  const locale = await getLocale()

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col gap-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/customer/book" className="flex-1">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <MapPinned className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{tBookTitle}</p>
                  <p className="text-sm text-muted-foreground">{tBookDesc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/customer/rides" className="flex-1">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <History className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{tHistoryTitle}</p>
                  <p className="text-sm text-muted-foreground">{tHistoryDesc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tTotalRides}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {allRides.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tCompleted}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {completedCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tTotalSpent}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatUZS(totalSpent)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Ride */}
        {activeRide && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Car className="h-5 w-5" />
                {tActiveRide}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{tStatus}</span>
                  <StatusBadge status={activeRide.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{tPickup}</span>
                  <span className="text-sm font-medium text-foreground">
                    {activeRide.pickup_address}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{tDropoff}</span>
                  <span className="text-sm font-medium text-foreground">
                    {activeRide.dropoff_address}
                  </span>
                </div>
                <Link href={`/customer/rides/${activeRide.id}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    {tTrackRide}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Rides */}
        {allRides.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{tRecentRides}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allRides.slice(0, 5).map((ride) => (
                  <Link
                    key={ride.id}
                    href={`/customer/rides/${ride.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {ride.pickup_address.slice(0, 30)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ride.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {formatUZS(
                          ride.fare_final || ride.fare_estimate || 0,
                        )}
                      </span>
                      <StatusBadge status={ride.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
