'use client'

import dynamic from 'next/dynamic'

export const DynamicMap = dynamic(
  () => import('@/components/map/map-container'),
  { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center bg-muted"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" /></div> },
)

export const DynamicLocationMarker = dynamic(
  () => import('@/components/map/location-marker'),
  { ssr: false },
)

export const DynamicDriverMarker = dynamic(
  () => import('@/components/map/driver-marker'),
  { ssr: false },
)

export const DynamicRouteLine = dynamic(
  () => import('@/components/map/route-line'),
  { ssr: false },
)
