'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  DynamicMap,
  DynamicLocationMarker,
  DynamicRouteLine,
} from '@/components/map/dynamic-map'
import MapController from '@/components/map/map-controller'
import { toggleOnlineStatus, updateDriverLocation } from '@/lib/actions/drivers'
import { acceptRide, updateRideStatus } from '@/lib/actions/rides'
import { getRoute, formatUZS, haversineDistance } from '@/lib/map-utils'
import type { Ride } from '@/lib/types'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function DriverMapPage() {
  const { t } = useI18n()
  const [isOnline, setIsOnline] = useState(false)
  const [myPos, setMyPos] = useState<[number, number]>([41.3111, 69.2797])
  const [pendingRides, setPendingRides] = useState<Ride[]>([])
  const [activeRide, setActiveRide] = useState<Ride | null>(null)
  const [routeGeom, setRouteGeom] = useState<[number, number][]>([])
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [driverStatus, setDriverStatus] = useState<'pending' | 'approved' | 'rejected' | 'suspended' | ''>('')
  const statusLabelMap: Record<string, string> = {
    pending: t('rides.status.pending'),
    approved: t('admin.approved'),
    rejected: t('admin.rejectedStatus'),
    suspended: t('admin.suspendedStatus'),
  }
  const statusLabel = driverStatus ? (statusLabelMap[driverStatus] || driverStatus) : ''

  // Load initial state
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: dp } = await supabase
        .from('driver_profiles')
        .select('is_online, current_lat, current_lng, status')
        .eq('id', user.id)
        .single()

      if (dp) {
        setDriverStatus(dp.status || '')
        setIsOnline(dp.status === 'approved' ? dp.is_online : false)
        if (dp.current_lat && dp.current_lng) {
          setMyPos([dp.current_lat, dp.current_lng])
        }
      }

      // Check for active ride
      const { data: active } = await supabase
        .from('rides')
        .select('*, profiles!rides_customer_id_fkey(*), tariffs(*)')
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'arriving', 'in_progress'])
        .limit(1)
        .single()

      if (active) setActiveRide(active)
    }
    init()
  }, [])

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyPos([pos.coords.latitude, pos.coords.longitude])
          if (isOnline) {
            updateDriverLocation(pos.coords.latitude, pos.coords.longitude)
          }
        },
        () => {}, // silently fail
      )
    }
  }, [isOnline])

  // Poll for pending rides when online - aggressive polling every 2 seconds
  useEffect(() => {
    if (!isOnline || activeRide || driverStatus !== 'approved') {
      setPendingRides([])
      return
    }

    const supabase = createClient()
    const fetchPending = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*, profiles!rides_customer_id_fkey(*), tariffs(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setPendingRides(data)
      }
    }

    // Fetch immediately
    fetchPending()
    
    // Poll every 2 seconds for aggressive updates
    const interval = setInterval(fetchPending, 2000)

    return () => clearInterval(interval)
  }, [isOnline, activeRide])

  // Update location periodically when online
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setMyPos(newPos)
          updateDriverLocation(newPos[0], newPos[1])
        })
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isOnline])

  // Fetch route when active ride exists
  useEffect(() => {
    if (!activeRide) {
      setRouteGeom([])
      return
    }

    async function fetchRoute() {
      const target =
        activeRide!.status === 'in_progress'
          ? { lat: activeRide!.dropoff_lat, lng: activeRide!.dropoff_lng }
          : { lat: activeRide!.pickup_lat, lng: activeRide!.pickup_lng }
      try {
        console.log('[v0] Fetching route from', myPos, 'to', target)
        const route = await getRoute({ lat: myPos[0], lng: myPos[1] }, target)
        console.log('[v0] Route fetched:', route)
        if (route?.geometry?.length) {
          setRouteGeom(route.geometry)
        } else {
          // Fallback: draw straight line if routing fails
          setRouteGeom([[myPos[0], myPos[1]], [target.lat, target.lng]])
        }
      } catch (err) {
        console.error('[v0] Failed to fetch route:', err)
        setRouteGeom([[myPos[0], myPos[1]], [target.lat, target.lng]])
      }
    }
    fetchRoute()
  }, [activeRide, myPos])

  const handleToggleOnline = async (val: boolean) => {
    if (driverStatus !== 'approved') return
    setIsOnline(val)
    await toggleOnlineStatus(val)
    if (val) {
      updateDriverLocation(myPos[0], myPos[1])
    }
  }

  const handleAccept = async (rideId: string) => {
    setAcceptingRideId(rideId)
    try {
      // First, verify the ride is still pending before accepting
      const supabase = createClient()
      const { data: rideCheck } = await supabase
        .from('rides')
        .select('status')
        .eq('id', rideId)
        .single()
      
      if (rideCheck?.status !== 'pending') {
        // Ride is no longer available - refresh list
        const { data } = await supabase
          .from('rides')
          .select('*, profiles!rides_customer_id_fkey(*), tariffs(*)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)
        if (data) setPendingRides(data)
        alert(t('driver.rideTaken'))
        return
      }

      // Now attempt to accept
      const ride = await acceptRide(rideId)
      setActiveRide(ride)
      setPendingRides([])
      alert(t('driver.rideAccepted'))
    } catch (err) {
      console.error('[v0] Accept error:', err)
      // Refresh list if accept failed
      const supabase = createClient()
      const { data } = await supabase
        .from('rides')
        .select('*, profiles!rides_customer_id_fkey(*), tariffs(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) setPendingRides(data)
    } finally {
      setAcceptingRideId(null)
    }
  }

  const handleStatusUpdate = async (status: Ride['status']) => {
    if (!activeRide) return
    setIsUpdating(true)
    try {
      const updated = await updateRideStatus(activeRide.id, status)
      if (status === 'completed' || status === 'cancelled') {
        setActiveRide(null)
      } else {
        setActiveRide(updated)
      }
    } catch {
      // silently fail
    } finally {
      setIsUpdating(false)
    }
  }

  const nextStatusLabel: Record<string, { status: Ride['status']; label: string }> = {
    accepted: { status: 'arriving', label: t('driver.startRide') },
    arriving: { status: 'in_progress', label: t('driver.startTrip') },
    in_progress: { status: 'completed', label: t('driver.finishRide') },
  }

  const isNearDropoff = (() => {
    if (!activeRide) return false
    if (activeRide.status !== 'in_progress') return false
    const dist = haversineDistance(
      { lat: myPos[0], lng: myPos[1] },
      { lat: activeRide.dropoff_lat, lng: activeRide.dropoff_lng },
    )
    return dist <= 0.2
  })()

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Panel */}
      <div className="w-full space-y-4 overflow-auto border-b p-4 lg:w-80 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">{t('driver.statusLabel')}</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{isOnline ? t('driver.online') : t('driver.offline')}</span>
            <Switch checked={isOnline} onCheckedChange={handleToggleOnline} disabled={driverStatus !== 'approved'} />
          </div>
        </div>

        {!isOnline && !activeRide && driverStatus === 'approved' && (
          <p className="text-sm text-muted-foreground">{t('driver.goOnline')}</p>
        )}
        {driverStatus && driverStatus !== 'approved' && (
          <p className="text-sm text-muted-foreground">
            {t('driver.accountStatus')} {statusLabel}. {t('driver.awaitApproval')}
          </p>
        )}

        {/* Active Ride */}
        {activeRide && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{t('driver.activeRide')}</span>
                <StatusBadge status={activeRide.status} />
              </div>
              
              {/* Customer Info */}
              {activeRide.profiles && (
                <div className="rounded bg-background p-2 text-sm">
                  <p className="font-medium text-foreground">{activeRide.profiles.full_name || t('driver.customer')}</p>
                  <p className="text-xs text-muted-foreground">{activeRide.profiles.phone || t('driver.noPhone')}</p>
                </div>
              )}
              
              {/* Pickup & Dropoff */}
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">{t('book.from')}:</span> <span className="text-foreground">{activeRide.pickup_address}</span></p>
                <p><span className="text-muted-foreground">{t('book.to')}:</span> <span className="text-foreground">{activeRide.dropoff_address}</span></p>
              </div>
              
              {/* Distance, Duration, Fare */}
              <div className="grid grid-cols-3 gap-2 rounded bg-background p-2 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">{t('book.distance')}</p>
                  <p className="font-semibold text-foreground">{activeRide.distance_km?.toFixed(1) || '--'} {t('book.km')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('book.duration')}</p>
                  <p className="font-semibold text-foreground">{activeRide.duration_min ? Math.ceil(activeRide.duration_min) : '--'} {t('book.min')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('driver.fare')}</p>
                  <p className="font-semibold text-foreground text-green-600">{formatUZS(activeRide.fare_estimate || 0)}</p>
                </div>
              </div>
              
              {/* Status Buttons */}
              {nextStatusLabel[activeRide.status] && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate(nextStatusLabel[activeRide.status].status)}
                  disabled={isUpdating || (activeRide.status === 'in_progress' && !isNearDropoff)}
                >
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
                  {nextStatusLabel[activeRide.status].label}
                </Button>
              )}
              {activeRide.status === 'in_progress' && !isNearDropoff && (
                <p className="text-xs text-muted-foreground">{t('driver.finishNear')}</p>
              )}
              {activeRide.status !== 'in_progress' && (
                <Button variant="outline" className="w-full" onClick={() => handleStatusUpdate('cancelled')} disabled={isUpdating}>
                  {t('driver.cancelRide')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Ride Requests */}
        {isOnline && !activeRide && pendingRides.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('driver.requests')}</h3>
            {pendingRides.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <p className="text-xs text-foreground">{ride.pickup_address}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-xs text-foreground">{ride.dropoff_address}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{formatUZS(ride.fare_estimate || 0)}</span>
                    <span className="text-xs text-muted-foreground">{ride.distance_km} {t('book.km')}</span>
                  </div>
                  {ride.tariffs?.name && (
                    <div className="text-xs text-muted-foreground">
                      {t('admin.class')}: <span className="text-foreground">{ride.tariffs.name}</span>
                    </div>
                  )}
                  <Button size="sm" className="w-full" onClick={() => handleAccept(ride.id)} disabled={acceptingRideId === ride.id}>
                    {acceptingRideId === ride.id ? t('driver.accepting') : t('driver.accept')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isOnline && !activeRide && pendingRides.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('driver.waiting')}</p>
        )}
      </div>

        {/* Map */}
        <div className="relative min-h-[400px] flex-1">
          <DynamicMap center={myPos} zoom={15}>
            <MapController
              center={myPos}
              zoom={15}
              bounds={
                routeGeom.length >= 2
                  ? routeGeom
                  : activeRide
                    ? [
                        [myPos[0], myPos[1]],
                        activeRide.status === 'in_progress'
                          ? [activeRide.dropoff_lat, activeRide.dropoff_lng]
                          : [activeRide.pickup_lat, activeRide.pickup_lng],
                      ]
                    : undefined
              }
            />
            {/* Show driver's current position - always visible */}
            <DynamicLocationMarker 
              position={myPos} 
              label={isOnline ? t('driver.youOnline') : t('driver.youOffline')} 
              color={isOnline ? 'blue' : 'gray'} 
            />
            {activeRide && (
              <>
                <DynamicLocationMarker position={[activeRide.pickup_lat, activeRide.pickup_lng]} label={t('book.from')} color="green" />
                <DynamicLocationMarker position={[activeRide.dropoff_lat, activeRide.dropoff_lng]} label={t('book.to')} color="red" />
                {routeGeom.length > 0 && <DynamicRouteLine positions={routeGeom} />}
              </>
            )}
          </DynamicMap>
        </div>
    </div>
  )
}
