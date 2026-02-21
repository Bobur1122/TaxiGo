'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import {
  MapPin,
  Navigation,
  Locate,
  Car,
  Clock,
  Route,
  Banknote,
  Loader2,
  X,
  Crown,
  Truck,
  Zap,
} from 'lucide-react'
import type { PromoCode } from '@/lib/types'

interface LatLng {
  lat: number
  lng: number
}

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

interface Tariff {
  id: string
  name: string
  icon: string
  name_en?: string
  name_uz?: string
  base_fare: number
  per_km_rate: number
  per_min_rate: number
  min_fare: number
  multiplier: number
}

interface RouteData {
  distance: number
  duration: number
  geometry: [number, number][]
}

const tariffIcons: Record<string, React.ReactNode> = {
  economy: <Car className="h-5 w-5" />,
  comfort: <Zap className="h-5 w-5" />,
  business: <Crown className="h-5 w-5" />,
  xl: <Truck className="h-5 w-5" />,
}

export default function BookRidePage() {
  const { t, locale } = useI18n()
  const router = useRouter()

  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null)
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | null>(null)
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([])
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false)
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteData | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [selectingOnMap, setSelectingOnMap] = useState<'pickup' | 'dropoff' | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [promoInfo, setPromoInfo] = useState<PromoCode | null>(null)
  const [promoMessage, setPromoMessage] = useState('')

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<unknown>(null)
  const pickupMarkerRef = useRef<unknown>(null)
  const dropoffMarkerRef = useRef<unknown>(null)
  const routeLineRef = useRef<unknown>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const pickupTimeout = useRef<ReturnType<typeof setTimeout>>()
  const dropoffTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Load tariffs
  useEffect(() => {
    fetch('/api/tariffs')
      .then((r) => r.json())
      .then((data) => {
        setTariffs(data)
        if (data.length > 0) setSelectedTariff(data[0])
      })
      .catch(() => {})
  }, [])

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return

    async function initMap() {
      const L = await import('leaflet')
      LRef.current = L

      // Fix default icons
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [41.311081, 69.279737],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map)

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        handleMapClickRef.current?.(e.latlng.lat, e.latlng.lng)
      })

      leafletMapRef.current = map
      setMapLoaded(true)
    }

    // Add leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }

    initMap()

    return () => {
      if (leafletMapRef.current) {
        (leafletMapRef.current as { remove: () => void }).remove()
        leafletMapRef.current = null
        setMapLoaded(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-detect user location on mount
  useEffect(() => {
    getMyLocation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded])

  // Ensure map renders after layout
  useEffect(() => {
    if (!mapLoaded) return
    const map = leafletMapRef.current as import('leaflet').Map | null
    if (!map) return
    const id = setTimeout(() => {
      map.invalidateSize()
    }, 0)
    return () => clearTimeout(id)
  }, [mapLoaded])

  // Map click handler ref so event listener always has latest state
  const handleMapClickRef = useRef<((lat: number, lng: number) => void) | null>(null)

  useEffect(() => {
    handleMapClickRef.current = async (lat: number, lng: number) => {
      if (!selectingOnMap) return
      const coords = { lat, lng }
      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=${locale}`
        )
        const data = await res.json()
        if (data.display_name) address = data.display_name
      } catch { /* ignore */ }

      if (selectingOnMap === 'pickup') {
        setPickupCoords(coords)
        setPickupAddress(address)
      } else {
        setDropoffCoords(coords)
        setDropoffAddress(address)
      }
      setSelectingOnMap(null)
    }
  }, [selectingOnMap])

  // Update markers on map when coords change
  useEffect(() => {
    if (!mapLoaded || !LRef.current) return
    const L = LRef.current
    const map = leafletMapRef.current as import('leaflet').Map | null
    if (!map) return

    // Pickup marker
    if (pickupMarkerRef.current) {
      (pickupMarkerRef.current as import('leaflet').Marker).remove()
      pickupMarkerRef.current = null
    }
    if (pickupCoords) {
      const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })
      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: greenIcon }).addTo(map)
      map.flyTo([pickupCoords.lat, pickupCoords.lng], 14, { duration: 1 })
    }

    // Dropoff marker
    if (dropoffMarkerRef.current) {
      (dropoffMarkerRef.current as import('leaflet').Marker).remove()
      dropoffMarkerRef.current = null
    }
    if (dropoffCoords) {
      const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })
      dropoffMarkerRef.current = L.marker([dropoffCoords.lat, dropoffCoords.lng], { icon: redIcon }).addTo(map)
      map.flyTo([dropoffCoords.lat, dropoffCoords.lng], 14, { duration: 1 })
    }

    // Fit bounds if both set
    if (pickupCoords && dropoffCoords) {
      const bounds = L.latLngBounds(
        [pickupCoords.lat, pickupCoords.lng],
        [dropoffCoords.lat, dropoffCoords.lng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [pickupCoords, dropoffCoords, mapLoaded])

  // Draw route line
  useEffect(() => {
    if (!mapLoaded || !LRef.current) return
    const L = LRef.current
    const map = leafletMapRef.current as import('leaflet').Map

    if (routeLineRef.current) {
      (routeLineRef.current as import('leaflet').Polyline).remove()
      routeLineRef.current = null
    }

    if (routeInfo && routeInfo.geometry.length > 0) {
      if (!map) return
      routeLineRef.current = L.polyline(routeInfo.geometry, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.8,
      }).addTo(map)
    }
  }, [routeInfo, mapLoaded])

  const getMyLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    let best: { lat: number; lng: number; accuracy: number } | null = null
    const finish = async (pos: { lat: number; lng: number }) => {
      setSelectingOnMap(null)
      setPickupCoords(pos)
      const map = leafletMapRef.current as import('leaflet').Map | null
      if (map) {
        map.setView([pos.lat, pos.lng], 14, { animate: true })
      }
      let address = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&addressdetails=1&accept-language=${locale}`
        )
        const data = await res.json()
        if (data.display_name) address = data.display_name
      } catch { /* ignore */ }
      setPickupAddress(address)
      setIsLocating(false)
    }

    const timeoutId = setTimeout(() => {
      if (best) finish({ lat: best.lat, lng: best.lng })
      else setIsLocating(false)
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }, 25000)

    // Start with an immediate high-accuracy fix
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        best = { lat: latitude, lng: longitude, accuracy }
        if (accuracy <= 25) {
          clearTimeout(timeoutId)
          finish({ lat: latitude, lng: longitude })
          return
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        if (!best || accuracy < best.accuracy) {
          best = { lat: latitude, lng: longitude, accuracy }
        }
        if (accuracy <= 25) {
          clearTimeout(timeoutId)
          if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
          }
          finish({ lat: latitude, lng: longitude })
        }
      },
      () => {
        clearTimeout(timeoutId)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25000 }
    )
  }, [locale])

  const requestMyLocation = useCallback(async () => {
    if (!navigator.geolocation) return
    try {
      if ('permissions' in navigator) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        if (status.state === 'denied') {
          alert(t('location.permissionDenied'))
          return
        }
      }
    } catch {
      // ignore permission API errors
    }
    getMyLocation()
  }, [getMyLocation, t])

  // Search suggestions (debounced)
  const searchAddress = useCallback((query: string, type: 'pickup' | 'dropoff') => {
    const timeoutRef = type === 'pickup' ? pickupTimeout : dropoffTimeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (query.length < 3) {
      if (type === 'pickup') { setPickupSuggestions([]); setShowPickupSuggestions(false) }
      else { setDropoffSuggestions([]); setShowDropoffSuggestions(false) }
      return
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=uz&viewbox=69.1,41.4,69.5,41.2&bounded=1&accept-language=${locale}`
        )
        const data: Suggestion[] = await res.json()
        if (type === 'pickup') { setPickupSuggestions(data); setShowPickupSuggestions(data.length > 0) }
        else { setDropoffSuggestions(data); setShowDropoffSuggestions(data.length > 0) }
      } catch { /* ignore */ }
    }, 400)
  }, [])

  const selectSuggestion = useCallback((s: Suggestion, type: 'pickup' | 'dropoff') => {
    const coords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) }
    if (type === 'pickup') {
      setPickupAddress(s.display_name); setPickupCoords(coords); setShowPickupSuggestions(false)
    } else {
      setDropoffAddress(s.display_name); setDropoffCoords(coords); setShowDropoffSuggestions(false)
    }
  }, [])

  // Fetch route when both coordinates set
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) { setRouteInfo(null); return }
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropoffCoords.lng},${dropoffCoords.lat}?overview=full&geometries=geojson`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]) {
          const route = data.routes[0]
          setRouteInfo({
            distance: route.distance / 1000,
            duration: route.duration / 60,
            geometry: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
          })
        }
      })
      .catch(() => {})
  }, [pickupCoords, dropoffCoords])

  const calculatePrice = useCallback((tariff: Tariff, route: RouteData) => {
    // Calculate base price from tariff rates
    const distanceCost = tariff.per_km_rate * route.distance
    const durationCost = tariff.per_min_rate * route.duration
    const basePrice = tariff.base_fare + distanceCost + durationCost
    
    // Apply multiplier and ensure minimum fare
    const finalPrice = Math.max(Math.round((basePrice * tariff.multiplier) / 100) * 100, tariff.min_fare)
    return finalPrice
  }, [])

  const applyPromo = useCallback((fare: number, minFare: number, baseFare: number) => {
    if (!promoInfo) return { finalFare: fare, discountValue: 0 }
    const effectiveMin = Math.max(minFare || 0, baseFare || 0, 1000)
    const discount =
      promoInfo.discount_amount
        ? promoInfo.discount_amount
        : promoInfo.discount_percent
          ? Math.round((fare * promoInfo.discount_percent) / 100)
          : 0
    const cappedDiscount = Math.min(discount, Math.max(fare - effectiveMin, 0))
    const finalFare = Math.max(fare - cappedDiscount, effectiveMin)
    return { finalFare, discountValue: cappedDiscount }
  }, [promoInfo])

  useEffect(() => {
    const code = promoCode.trim().toUpperCase()
    if (!code) {
      setPromoStatus('idle')
      setPromoInfo(null)
      setPromoMessage('')
      return
    }

    const timeout = setTimeout(async () => {
      setPromoStatus('checking')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setPromoStatus('invalid')
        setPromoInfo(null)
        setPromoMessage(t('promo.invalid'))
        return
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoStatus('invalid')
        setPromoInfo(null)
        setPromoMessage(t('promo.expired'))
        return
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setPromoStatus('invalid')
        setPromoInfo(null)
        setPromoMessage(t('promo.maxed'))
        return
      }

      setPromoStatus('valid')
      setPromoInfo(data)
      setPromoMessage(t('promo.applied'))
    }, 400)

    return () => clearTimeout(timeout)
  }, [promoCode, t])

  const handleOrder = async () => {
    if (!pickupCoords || !dropoffCoords || !selectedTariff || !routeInfo) return
    setIsOrdering(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fare = calculatePrice(selectedTariff, routeInfo)
      const { finalFare } = applyPromo(fare, selectedTariff.min_fare, selectedTariff.base_fare)
      const { data, error } = await supabase.from('rides').insert({
        customer_id: user.id,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dropoff_lat: dropoffCoords.lat,
        dropoff_lng: dropoffCoords.lng,
        status: 'pending',
        fare_estimate: finalFare,
        distance_km: routeInfo.distance,
        duration_min: routeInfo.duration,
        tariff_id: selectedTariff.id,
        promo_code: promoInfo?.code || null,
      }).select().single()

      if (error) throw error
      if (data) router.push(`/customer/rides/${data.id}`)
    } catch (err) {
      console.error('Order error:', err)
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left panel */}
      <div className="flex w-full flex-col gap-4 overflow-y-auto border-r bg-background p-4 lg:w-[420px]">
        <h1 className="text-xl font-bold text-foreground">{t('book.title')}</h1>

        {/* Pickup input */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="relative flex-1">
              <Input
                placeholder={t('book.fromPlaceholder')}
                value={pickupAddress}
                onChange={(e) => { setPickupAddress(e.target.value); searchAddress(e.target.value, 'pickup') }}
                onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                className="pr-20"
              />
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
                <button type="button" onClick={requestMyLocation} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title={t('book.myLocation')}>
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => setSelectingOnMap(selectingOnMap === 'pickup' ? null : 'pickup')}
                  className={cn('rounded p-1 hover:bg-muted', selectingOnMap === 'pickup' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
                  title={t('book.pickOnMap')}>
                  <Navigation className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {showPickupSuggestions && (
            <div className="absolute left-10 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg">
              {pickupSuggestions.map((s, i) => (
                <button key={i} className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted" onMouseDown={() => selectSuggestion(s, 'pickup')}>
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 text-foreground">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropoff input */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <MapPin className="h-4 w-4 text-red-600" />
            </div>
            <div className="relative flex-1">
              <Input
                placeholder={t('book.toPlaceholder')}
                value={dropoffAddress}
                onChange={(e) => { setDropoffAddress(e.target.value); searchAddress(e.target.value, 'dropoff') }}
                onFocus={() => dropoffSuggestions.length > 0 && setShowDropoffSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
                className="pr-10"
              />
              <button type="button" onClick={() => setSelectingOnMap(selectingOnMap === 'dropoff' ? null : 'dropoff')}
                className={cn('absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted', selectingOnMap === 'dropoff' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
                title={t('book.pickOnMap')}>
                <Navigation className="h-4 w-4" />
              </button>
            </div>
          </div>
          {showDropoffSuggestions && (
            <div className="absolute left-10 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg">
              {dropoffSuggestions.map((s, i) => (
                <button key={i} className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted" onMouseDown={() => selectSuggestion(s, 'dropoff')}>
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 text-foreground">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map selection indicator */}
        {selectingOnMap && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
            <Navigation className="h-4 w-4" />
            <span>{selectingOnMap === 'pickup' ? t('book.from') : t('book.to')}: {t('book.pickOnMap')}</span>
            <button onClick={() => setSelectingOnMap(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Tariff selection */}
        {tariffs.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t('book.selectTariff')}</p>
            <div className="grid grid-cols-2 gap-2">
              {tariffs.map((tariff) => {
                const isSelected = selectedTariff?.id === tariff.id
                const price = routeInfo ? calculatePrice(tariff, routeInfo) : null
                return (
                  <button key={tariff.id} onClick={() => setSelectedTariff(tariff)}
                    className={cn('flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all',
                      isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/40')}>
                    <div className={cn(isSelected ? 'text-primary' : 'text-muted-foreground')}>
                      {tariffIcons[tariff.icon] || <Car className="h-5 w-5" />}
                    </div>
                    <span className={cn('text-sm font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                      {t(`tariff.${tariff.icon}`) !== `tariff.${tariff.icon}` ? t(`tariff.${tariff.icon}`) : tariff.name}
                    </span>
                    {price ? (
                      <span className={cn('text-xs font-medium', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                        {price.toLocaleString()} {t('book.sum')}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{tariff.base_fare.toLocaleString()}+</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Route info card */}
        {routeInfo && selectedTariff && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Route className="h-4 w-4" />
                  <span>{routeInfo.distance.toFixed(1)} {t('book.km')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(routeInfo.duration)} {t('book.min')}</span>
                </div>
              </div>
              {(() => {
                const baseFare = calculatePrice(selectedTariff, routeInfo)
                const { finalFare, discountValue } = applyPromo(baseFare, selectedTariff.min_fare, selectedTariff.base_fare)
                return (
                  <div className="flex flex-col items-end gap-1">
                    {discountValue > 0 && (
                      <span className="text-xs text-emerald-600">-{discountValue.toLocaleString()} {t('book.sum')}</span>
                    )}
                    <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
                      <Banknote className="h-5 w-5" />
                      {finalFare.toLocaleString()} {t('book.sum')}
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Promo code */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{t('promo.title')}</p>
          <div className="flex items-center gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="uppercase"
            />
            <Button type="button" variant="outline" disabled={promoStatus === 'checking'} onClick={() => setPromoCode(promoCode.trim().toUpperCase())}>
              {promoStatus === 'checking' ? t('promo.checking') : t('promo.apply')}
            </Button>
          </div>
          {promoMessage && (
            <p className={cn('text-xs', promoStatus === 'valid' ? 'text-emerald-600' : 'text-destructive')}>
              {promoMessage}
            </p>
          )}
        </div>

        {/* Order button */}
        <Button size="lg" className="w-full text-base font-semibold"
          disabled={!pickupCoords || !dropoffCoords || !selectedTariff || !routeInfo || isOrdering}
          onClick={handleOrder}>
          {isOrdering ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('book.ordering')}</>
          ) : (
            <><Car className="mr-2 h-4 w-4" />{t('book.orderRide')}</>
          )}
        </Button>
      </div>

      {/* Map area */}
      <div className="relative min-h-[400px] flex-1">
        <div ref={mapRef} className="h-full w-full" style={{ minHeight: '400px' }} />
        {selectingOnMap && (
          <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            {t('book.pickOnMap')}
          </div>
        )}
      </div>
    </div>
  )
}
