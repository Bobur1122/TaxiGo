'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DriverStatus } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

export default function DriverActions({
  driverId,
  currentStatus,
  onStatusChanged,
}: {
  driverId: string
  currentStatus: DriverStatus
  onStatusChanged?: () => void
}) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (status: DriverStatus) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || t('errors.actionFailed'))
      onStatusChanged?.()
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-1">
      {currentStatus === 'pending' && (
        <>
          <Button size="sm" variant="default" onClick={() => handleAction('approved')} disabled={isLoading}>{t('admin.approve')}</Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction('rejected')} disabled={isLoading}>{t('admin.reject')}</Button>
        </>
      )}
      {currentStatus === 'approved' && (
        <Button size="sm" variant="outline" onClick={() => handleAction('suspended')} disabled={isLoading}>{t('admin.suspend')}</Button>
      )}
      {currentStatus === 'suspended' && (
        <Button size="sm" variant="default" onClick={() => handleAction('approved')} disabled={isLoading}>{t('admin.approve')}</Button>
      )}
      {currentStatus === 'rejected' && (
        <Button size="sm" variant="default" onClick={() => handleAction('approved')} disabled={isLoading}>{t('admin.approve')}</Button>
      )}
    </div>
  )
}
