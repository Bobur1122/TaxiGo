'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DynamicMap,
  DynamicLocationMarker,
  DynamicDriverMarker,
  DynamicRouteLine,
} from '@/components/map/dynamic-map'
import { getRoute } from '@/lib/map-utils'
import type { Ride } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

export default function RideTracker({ ride }: { ride: Ride }) {
  const { t } = useI18n()
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null)
  const [routeGeom, setRouteGeom] = useState<[number, number][]>([])

  useEffect(() => {
    if (!ride.driver_id) return

    const fetchDriverLocation = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('driver_profiles')
        .select('current_lat, current_lng')
        .eq('id', ride.driver_id!)
        .single()

      if (data?.current_lat && data?.current_lng) {
        setDriverPos([data.current_lat, data.current_lng])
      }
    }

    fetchDriverLocation()
    const interval = setInterval(fetchDriverLocation, 5000)
    return () => clearInterval(interval)
  }, [ride.driver_id])

  useEffect(() => {
    async function fetchRoute() {
      const route = await getRoute(
        { lat: ride.pickup_lat, lng: ride.pickup_lng },
        { lat: ride.dropoff_lat, lng: ride.dropoff_lng },
      )
      if (route) setRouteGeom(route.geometry)
    }
    fetchRoute()
  }, [ride.pickup_lat, ride.pickup_lng, ride.dropoff_lat, ride.dropoff_lng])

  return (
    <DynamicMap
      center={[ride.pickup_lat, ride.pickup_lng]}
      zoom={14}
    >
      <DynamicLocationMarker
        position={[ride.pickup_lat, ride.pickup_lng]}
        label={t('rides.pickup')}
        color="green"
      />
      <DynamicLocationMarker
        position={[ride.dropoff_lat, ride.dropoff_lng]}
        label={t('rides.dropoff')}
        color="red"
      />
      {routeGeom.length > 0 && <DynamicRouteLine positions={routeGeom} />}
      {driverPos && (
        <DynamicDriverMarker position={driverPos} name={t('rides.yourDriver')} />
      )}
    </DynamicMap>
  )
}
