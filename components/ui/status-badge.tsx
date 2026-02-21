'use client'

import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  arriving: 'bg-cyan-100 text-cyan-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
  online: 'bg-emerald-100 text-emerald-800',
  offline: 'bg-muted text-muted-foreground',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-muted text-muted-foreground'
  const { t } = useI18n()
  const statusKeyMap: Record<string, string> = {
    pending: 'rides.status.pending',
    accepted: 'rides.status.accepted',
    arriving: 'rides.status.arriving',
    in_progress: 'rides.status.in_progress',
    completed: 'rides.status.completed',
    cancelled: 'rides.status.cancelled',
    approved: 'admin.approved',
    rejected: 'admin.rejectedStatus',
    suspended: 'admin.suspendedStatus',
    online: 'driver.online',
    offline: 'driver.offline',
  }
  const labelKey = statusKeyMap[status]
  const label = labelKey ? t(labelKey) : status.replace('_', ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  )
}
