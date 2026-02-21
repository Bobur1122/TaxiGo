'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { TASHKENT_CENTER, DEFAULT_ZOOM } from '@/lib/map-utils'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

interface MapWrapperProps {
  children?: React.ReactNode
  center?: [number, number]
  zoom?: number
  className?: string
}

export default function MapWrapper({
  children,
  center = [TASHKENT_CENTER.lat, TASHKENT_CENTER.lng],
  zoom = DEFAULT_ZOOM,
  className = 'h-full w-full',
}: MapWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      const container = containerRef.current as (HTMLElement & { _leaflet_id?: number }) | null
      if (container && container._leaflet_id) {
        delete container._leaflet_id
      }
    }
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      <MapContainer
        whenCreated={(map) => {
          if (mapRef.current) {
            mapRef.current.remove()
          }
          mapRef.current = map
        }}
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </div>
  )
}
