'use client'

import { Marker, Popup, useMapEvents } from 'react-leaflet'
import { useState, useMemo } from 'react'
import L from 'leaflet'

interface LocationMarkerProps {
  position: [number, number] | null
  onPositionChange?: (lat: number, lng: number) => void
  draggable?: boolean
  label?: string
  color?: 'blue' | 'red' | 'green' | 'gray'
}

const iconUrls: Record<string, string> = {
  blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  green: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  gray: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
}

export default function LocationMarker({
  position,
  onPositionChange,
  draggable = false,
  label,
  color = 'blue',
}: LocationMarkerProps) {
  const [pos, setPos] = useState(position)

  const icon = useMemo(
    () =>
      new L.Icon({
        iconUrl: iconUrls[color],
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    [color],
  )

  useMapEvents({
    click(e) {
      if (onPositionChange && !position) {
        setPos([e.latlng.lat, e.latlng.lng])
        onPositionChange(e.latlng.lat, e.latlng.lng)
      }
    },
  })

  const displayPos = position || pos

  if (!displayPos) return null

  return (
    <Marker
      position={displayPos}
      icon={icon}
      draggable={draggable}
      eventHandlers={
        draggable
          ? {
              dragend: (e) => {
                const marker = e.target
                const newPos = marker.getLatLng()
                setPos([newPos.lat, newPos.lng])
                onPositionChange?.(newPos.lat, newPos.lng)
              },
            }
          : undefined
      }
    >
      {label && <Popup>{label}</Popup>}
    </Marker>
  )
}
