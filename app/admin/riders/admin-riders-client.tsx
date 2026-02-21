'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import type { Profile } from '@/lib/types'

type RiderSummary = Profile & { ride_count: number; last_ride_at: string }

export default function AdminRidersClient({ riders }: { riders: RiderSummary[] }) {
  const { t } = useI18n()

  return (
    <div className="p-4 lg:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t('admin.riderManagement')}</h2>
      {riders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t('admin.noRidersOrders')}</CardContent>
        </Card>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.name')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.phone')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.totalOrders')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.lastOrder')}</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">{t('admin.joined')}</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr key={rider.id} className="border-b last:border-0">
                  <td className="py-3 text-foreground">{rider.full_name || t('admin.unnamed')}</td>
                  <td className="py-3 text-foreground">{rider.phone || '-'}</td>
                  <td className="py-3 text-foreground">{rider.ride_count}</td>
                  <td className="py-3 text-foreground">{new Date(rider.last_ride_at).toLocaleDateString()}</td>
                  <td className="py-3 text-right text-muted-foreground">{new Date(rider.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
