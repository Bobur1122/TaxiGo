'use client'

import { Polyline } from 'react-leaflet'

interface RouteLineProps {
  positions: [number, number][]
  color?: string
}

export default function RouteLine({
  positions,
  color = '#0f172a',
}: RouteLineProps) {
  if (positions.length < 2) return null
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color, weight: 4, opacity: 0.8 }}
    />
  )
}
