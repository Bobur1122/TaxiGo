import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatUZS } from '@/lib/map-utils'
import { tServer } from '@/lib/i18n-server'

export default async function DriverRideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [
    tDetails,
    tTripInfo,
    tPickup,
    tDropoff,
    tDistance,
    tFare,
    tCustomer,
    tKm,
    tUnknown,
  ] = await Promise.all([
    tServer('rides.details'),
    tServer('rides.tripInfo'),
    tServer('rides.pickup'),
    tServer('rides.dropoff'),
    tServer('book.distance'),
    tServer('driver.fare'),
    tServer('rides.customer'),
    tServer('book.km'),
    tServer('admin.unknown'),
  ])
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: ride } = await supabase.from('rides').select('*, profiles!rides_customer_id_fkey(*)').eq('id', id).single()
  if (!ride) notFound()

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{tDetails}</h2>
          <StatusBadge status={ride.status} />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-foreground">{tTripInfo}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tPickup}</span>
              <span className="text-right font-medium text-foreground">{ride.pickup_address}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tDropoff}</span>
              <span className="text-right font-medium text-foreground">{ride.dropoff_address}</span>
            </div>
            {ride.distance_km && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tDistance}</span>
                <span className="font-medium text-foreground">{ride.distance_km} {tKm}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-3 text-sm">
              <span className="font-semibold text-foreground">{tFare}</span>
              <span className="text-lg font-bold text-foreground">{formatUZS(ride.fare_final || ride.fare_estimate || 0)}</span>
            </div>
          </CardContent>
        </Card>
        {ride.profiles && (
          <Card>
            <CardHeader><CardTitle className="text-foreground">{tCustomer}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{ride.profiles.full_name || tUnknown}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
