'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Star } from 'lucide-react'
import DriverActions from './driver-actions'
import { useI18n } from '@/lib/i18n'
import type { DriverProfile } from '@/lib/types'

export default function AdminDriversClient() {
  const { t } = useI18n()
  const [drivers, setDrivers] = useState<DriverProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/drivers', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || t('errors.loadFailed'))
      setDrivers(json.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    async function init() {
      try {
        if (active) {
          await load()
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : t('errors.loadFailed'))
      }
    }
    init()
    return () => { active = false }
  }, [])

  return (
    <div className="p-4 lg:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t('admin.driverManagement')}</h2>
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t('loading')}</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t('admin.noDrivers')}</CardContent>
        </Card>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.name')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.vehicle')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.plate')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.class')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.year')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.experience')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.status')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.rating')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.rides')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.online')}</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-b last:border-0">
                  <td className="py-3 text-foreground">{driver.profiles?.full_name || t('admin.unknown')}</td>
                  <td className="py-3 text-foreground">{driver.vehicle_color} {driver.vehicle_model}</td>
                  <td className="py-3 text-foreground">{driver.vehicle_plate}</td>
                  <td className="py-3 text-foreground capitalize">{driver.vehicle_class || '-'}</td>
                  <td className="py-3 text-foreground">{driver.vehicle_year || '-'}</td>
                  <td className="py-3 text-foreground">{driver.experience_years != null ? `${driver.experience_years}${t('unit.yearShort')}` : '-'}</td>
                  <td className="py-3"><StatusBadge status={driver.status} /></td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 text-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {driver.rating_avg?.toFixed(1) || '5.0'}
                    </span>
                  </td>
                  <td className="py-3 text-foreground">{driver.total_rides}</td>
                  <td className="py-3"><StatusBadge status={driver.is_online ? 'online' : 'offline'} /></td>
                  <td className="py-3 text-right">
                    <DriverActions
                      driverId={driver.id}
                      currentStatus={driver.status}
                      onStatusChanged={load}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
