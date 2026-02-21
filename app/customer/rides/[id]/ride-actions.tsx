"use client"

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateRideStatus } from '@/lib/actions/rides'
import type { Ride } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

export default function RideActions({ ride }: { ride: Ride }) {
  const router = useRouter()
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()

  const handleFinish = () => {
    startTransition(async () => {
      await updateRideStatus(ride.id, 'completed')
      router.refresh()
    })
  }

  if (ride.status !== 'in_progress') return null

  return (
    <div className="flex justify-end">
      <Button onClick={handleFinish} disabled={isPending}>
        {isPending ? t('rides.finishing') : t('rides.finishRide')}
      </Button>
    </div>
  )
}
