export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllRides, type RideRange } from '@/lib/actions/rides'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatUZS } from '@/lib/map-utils'
import { getLocale, tServer } from '@/lib/i18n-server'

type Props = {
  searchParams?: { range?: RideRange; from?: string; to?: string }
}

export default async function AdminRidesPage({ searchParams }: Props) {
  const range: RideRange = 'all'
  const [
    tRides,
    tActive,
    tCompleted,
    tCancelled,
    tPickup,
    tDropoff,
    tClass,
    tStatus,
    tDistance,
    tFare,
    tDate,
    tNoRides,
    tKm,
    tFilter,
  ] = await Promise.all([
    tServer('admin.rides'),
    tServer('admin.active'),
    tServer('rides.status.in_progress'),
    tServer('rides.status.cancelled'),
    tServer('admin.pickup'),
    tServer('admin.dropoff'),
    tServer('admin.class'),
    tServer('admin.status'),
    tServer('book.distance'),
    tServer('admin.fare'),
    tServer('admin.date'),
    tServer('admin.noRides'),
    tServer('book.km'),
    tServer('admin.filterBy'),
  ])
  const locale = await getLocale()
  const rides = await getAllRides(500, range)

  const completed = rides.filter(r => r.status === 'completed').length
  const cancelled = rides.filter(r => r.status === 'cancelled').length
  const active = rides.filter(r => ['pending', 'accepted', 'arriving', 'in_progress'].includes(r.status)).length

  return (
    <div className="p-4 lg:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{tRides}</h2>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{active}</p>
            <p className="text-xs text-muted-foreground">{tActive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{completed}</p>
            <p className="text-xs text-muted-foreground">{tCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{cancelled}</p>
            <p className="text-xs text-muted-foreground">{tCancelled}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium text-muted-foreground">{tPickup}</th>
              <th className="pb-2 font-medium text-muted-foreground">{tDropoff}</th>
              <th className="pb-2 font-medium text-muted-foreground">{tClass}</th>
              <th className="pb-2 font-medium text-muted-foreground">{tStatus}</th>
              <th className="pb-2 font-medium text-muted-foreground">{tDistance}</th>
              <th className="pb-2 text-right font-medium text-muted-foreground">{tFare}</th>
              <th className="pb-2 text-right font-medium text-muted-foreground">{tDate}</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id} className="border-b last:border-0">
                <td className="max-w-[150px] truncate py-2 text-foreground">{ride.pickup_address}</td>
                <td className="max-w-[150px] truncate py-2 text-foreground">{ride.dropoff_address}</td>
                <td className="py-2 text-foreground">{ride.tariffs?.name || ride.tariffs?.icon || '-'}</td>
                <td className="py-2"><StatusBadge status={ride.status} /></td>
                <td className="py-2 text-foreground">{ride.distance_km ? `${ride.distance_km} ${tKm}` : '-'}</td>
                <td className="py-2 text-right font-medium text-foreground">{formatUZS(ride.fare_final || ride.fare_estimate || 0)}</td>
                <td className="py-2 text-right text-muted-foreground">{new Date(ride.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ')}</td>
              </tr>
            ))}
            {rides.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{tNoRides}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
