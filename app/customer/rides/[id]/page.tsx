import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatUZS } from '@/lib/map-utils'
import RideTracker from './ride-tracker'
import RideRatingForm from './ride-rating-form'
import RideActions from './ride-actions'
import { tServer } from '@/lib/i18n-server'

export const dynamic = 'force-dynamic'

export default async function RideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [
    tDetails,
    tTripInfo,
    tFrom,
    tTo,
    tDistance,
    tDuration,
    tFare,
    tDriver,
    tName,
    tVehicle,
    tPlate,
    tRating,
    tKm,
    tMin,
    tUnknown,
    tRated,
    tPending,
    tAccepted,
    tArriving,
    tInProgress,
    tCompleted,
  ] = await Promise.all([
    tServer('rides.details'),
    tServer('rides.tripInfo'),
    tServer('book.from'),
    tServer('book.to'),
    tServer('book.distance'),
    tServer('book.duration'),
    tServer('driver.fare'),
    tServer('auth.driver'),
    tServer('profile.name'),
    tServer('admin.vehicle'),
    tServer('admin.plate'),
    tServer('driver.rating'),
    tServer('book.km'),
    tServer('book.min'),
    tServer('admin.unknown'),
    tServer('rides.youRated'),
    tServer('rides.status.pending'),
    tServer('rides.status.accepted'),
    tServer('rides.status.arriving'),
    tServer('rides.status.in_progress'),
    tServer('rides.status.completed'),
  ])
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: ride } = await supabase
    .from('rides')
    .select('*, driver_profiles(*, profiles(*))')
    .eq('id', id)
    .single()

  if (!ride) notFound()

  const isActive = ['pending', 'accepted', 'arriving', 'in_progress'].includes(ride.status)

  const { data: existingRating } = await supabase
    .from('ratings')
    .select('*')
    .eq('ride_id', id)
    .eq('from_user_id', user.id)
    .maybeSingle()

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{tDetails}</h2>
          <StatusBadge status={ride.status} />
        </div>

        {/* Map for active rides */}
        {isActive && (
          <div className="h-64 overflow-hidden rounded-lg border lg:h-80">
            <RideTracker ride={ride} />
          </div>
        )}

        {/* Status steps */}
        {isActive && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {['pending', 'accepted', 'arriving', 'in_progress', 'completed'].map((step, i) => {
                  const steps = ['pending', 'accepted', 'arriving', 'in_progress', 'completed']
                  const currentIndex = steps.indexOf(ride.status)
                  const isCompleted = i <= currentIndex
                  const isCurrent = step === ride.status
                  const labelMap: Record<string, string> = {
                    pending: tPending,
                    accepted: tAccepted,
                    arriving: tArriving,
                    in_progress: tInProgress,
                    completed: tCompleted,
                  }
                  return (
                    <div key={step} className="flex flex-1 flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      >
                        {i + 1}
                      </div>
                      <span className="mt-1 text-center text-[10px] capitalize text-muted-foreground">
                        {labelMap[step] || step.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ride Info */}
        <Card>
          <CardHeader>
              <CardTitle className="text-foreground">{tTripInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tFrom}</span>
              <span className="text-right font-medium text-foreground">{ride.pickup_address}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tTo}</span>
              <span className="text-right font-medium text-foreground">{ride.dropoff_address}</span>
            </div>
            {ride.distance_km && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tDistance}</span>
                <span className="font-medium text-foreground">{ride.distance_km} {tKm}</span>
              </div>
            )}
            {ride.duration_min && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tDuration}</span>
                <span className="font-medium text-foreground">{ride.duration_min} {tMin}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-3 text-sm">
              <span className="font-semibold text-foreground">{tFare}</span>
              <span className="text-lg font-bold text-foreground">
                {formatUZS(ride.fare_final || ride.fare_estimate || 0)}
              </span>
            </div>
            <RideActions ride={ride} />
          </CardContent>
        </Card>

        {/* Driver Info */}
        {ride.driver_profiles && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{tDriver}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tName}</span>
                <span className="font-medium text-foreground">{ride.driver_profiles.profiles?.full_name || tUnknown}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tVehicle}</span>
                <span className="font-medium text-foreground">{ride.driver_profiles.vehicle_color} {ride.driver_profiles.vehicle_model}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tPlate}</span>
                <span className="font-medium text-foreground">{ride.driver_profiles.vehicle_plate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tRating}</span>
                <span className="font-medium text-foreground">{ride.driver_profiles.rating_avg?.toFixed(1) || '5.0'} / 5</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Form */}
        {ride.status === 'completed' && !existingRating && ride.driver_id && (
          <RideRatingForm rideId={ride.id} driverId={ride.driver_id} />
        )}
        {existingRating && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {tRated}{' '}
                {'*'.repeat(existingRating.rating)}
                {'.'.repeat(5 - existingRating.rating)}
              </p>
              {existingRating.comment && (
                <p className="mt-1 text-sm text-foreground">{existingRating.comment}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

