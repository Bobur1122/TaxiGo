"use client"

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'

export default function MapController({
  center,
  zoom = 15,
  bounds,
}: {
  center?: [number, number]
  zoom?: number
  bounds?: [number, number][]
}) {
  const map = useMap()

  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds as LatLngTuple[], { padding: [40, 40] })
      return
    }
    if (center) {
      map.setView(center as LatLngTuple, zoom)
    }
  }, [map, bounds, center, zoom])

  return null
}
