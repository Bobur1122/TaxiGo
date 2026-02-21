'use client'

import { Marker, Popup } from 'react-leaflet'
import { useMemo } from 'react'
import L from 'leaflet'
import { useI18n } from '@/lib/i18n'

interface DriverMarkerProps {
  position: [number, number]
  name?: string
  vehicle?: string
}

export default function DriverMarker({
  position,
  name,
  vehicle,
}: DriverMarkerProps) {
  const { t } = useI18n()
  const displayName = name || t('auth.driver')
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-driver-icon',
        html: `<div style="background:#0f172a;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  )

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold">{displayName}</p>
          {vehicle && <p className="text-muted-foreground">{vehicle}</p>}
        </div>
      </Popup>
    </Marker>
  )
}
