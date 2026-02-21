"use client"

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { formatUZS } from '@/lib/map-utils'
import { cancelRide } from '@/lib/actions/rides'
import type { Ride } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

const cancellableStatuses: Ride['status'][] = ['pending', 'accepted', 'arriving']

export default function CustomerRidesClient({ rides }: { rides: Ride[] }) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancel = (id: string) => {
    setCancellingId(id)
    startTransition(async () => {
      try {
        await cancelRide(id)
        router.refresh()
      } finally {
        setCancellingId(null)
      }
    })
  }

  return (
    <div className="space-y-3">
      {rides.map((ride) => {
        const canCancel = cancellableStatuses.includes(ride.status)
        return (
          <Card key={ride.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <Link href={`/customer/rides/${ride.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{ride.pickup_address}</p>
                <p className="truncate text-sm text-muted-foreground">{ride.dropoff_address}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(ride.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </Link>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={ride.status} />
                <span className="text-sm font-semibold text-foreground">
                  {formatUZS(ride.fare_final || ride.fare_estimate || 0)}
                </span>
                {canCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(ride.id)}
                    disabled={isPending && cancellingId === ride.id}
                  >
                    {isPending && cancellingId === ride.id ? t('rides.cancelling') : t('rides.cancel')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
