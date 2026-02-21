import type { LatLng, RouteInfo, FareEstimate } from './types'

export const TASHKENT_CENTER: LatLng = { lat: 41.3111, lng: 69.2797 }
export const DEFAULT_ZOOM = 13

// Geocode address to coordinates via our server-side proxy
export async function geocodeAddress(
  query: string,
): Promise<{ lat: number; lng: number; display_name: string }[]> {
  const res = await fetch(
    `/api/geocode?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=uz`,
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.map(
    (item: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
    }),
  )
}

// Reverse geocode coordinates to address
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}&reverse=true`)
  if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  const data = await res.json()
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

// Get route between two points via OSRM proxy
export async function getRoute(
  from: LatLng,
  to: LatLng,
): Promise<RouteInfo | null> {
  const res = await fetch(
    `/api/route?from_lat=${from.lat}&from_lng=${from.lng}&to_lat=${to.lat}&to_lng=${to.lng}`,
  )
  if (!res.ok) return null
  const data = await res.json()
  return data
}

// Calculate fare based on distance and duration
export function calculateFare(
  distance_km: number,
  duration_min: number,
  baseFare: number = 5000,
  perKm: number = 2000,
  perMin: number = 500,
): FareEstimate {
  const distance_cost = distance_km * perKm
  const time_cost = duration_min * perMin
  const total = Math.max(baseFare + distance_cost + time_cost, 8000) // minimum fare 8000 UZS

  return {
    base_fare: baseFare,
    distance_cost,
    time_cost,
    total: Math.round(total),
    distance_km: Math.round(distance_km * 10) / 10,
    duration_min: Math.round(duration_min),
  }
}

// Format currency in UZS
export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' UZS'
}

// Calculate distance between two points using Haversine formula
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const calc =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng
  return R * 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc))
}
