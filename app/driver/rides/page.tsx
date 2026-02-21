import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatUZS } from '@/lib/map-utils'
import { History } from 'lucide-react'
import { getLocale, tServer } from '@/lib/i18n-server'

export default async function DriverRidesPage() {
  const [tTitle, tNoRides] = await Promise.all([
    tServer('rides.title'),
    tServer('rides.noRides'),
  ])
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })

  const allRides = rides || []

  return (
    <div className="p-4 lg:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{tTitle}</h2>
      {allRides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <History className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{tNoRides}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allRides.map((ride) => (
            <Link key={ride.id} href={`/driver/rides/${ride.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{ride.pickup_address}</p>
                    <p className="truncate text-sm text-muted-foreground">{ride.dropoff_address}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(ride.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={ride.status} />
                    <span className="text-sm font-semibold text-foreground">{formatUZS(ride.fare_final || ride.fare_estimate || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
