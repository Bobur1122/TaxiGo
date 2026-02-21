'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatUZS } from '@/lib/map-utils'
import { Radio, Star } from 'lucide-react'
import DriverOnboarding from './onboarding'
import { useI18n } from '@/lib/i18n'

export default function DriverDashboardClient() {
  const { t } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [driverProfile, setDriverProfile] = useState<any>(null)
  const [rides, setRides] = useState<any[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: dp } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: ridesData } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!active) return
      setDriverProfile(dp)
      setRides(ridesData || [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [router])

  if (loading) {
    return <div className="p-4">{t('loading')}</div>
  }

  if (!driverProfile) {
    return <DriverOnboarding />
  }

  const statusLabelMap: Record<string, string> = {
    pending: t('rides.status.pending'),
    approved: t('admin.approved'),
    rejected: t('admin.rejectedStatus'),
    suspended: t('admin.suspendedStatus'),
  }
  const statusLabel = statusLabelMap[driverProfile.status] || driverProfile.status

  const hasRequiredFields = !!(
    driverProfile.license_number &&
    driverProfile.vehicle_model &&
    driverProfile.vehicle_color &&
    driverProfile.vehicle_plate &&
    driverProfile.vehicle_class &&
    driverProfile.vehicle_year &&
    driverProfile.experience_years
  )

  if (!hasRequiredFields) {
    return <DriverOnboarding initialProfile={driverProfile} />
  }

  if (driverProfile.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Radio className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{t('driver.pendingTitle')}</h2>
        <p className="max-w-md text-center text-muted-foreground">
          {t('driver.pendingDesc')}
        </p>
        <StatusBadge status="pending" />
      </div>
    )
  }

  if (driverProfile.status === 'rejected' || driverProfile.status === 'suspended') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-xl font-semibold text-foreground">{t('driver.accountStatus')} {statusLabel}</h2>
        <p className="text-muted-foreground">{t('driver.contactSupport')}</p>
        <StatusBadge status={driverProfile.status} />
      </div>
    )
  }

  const todayRides = rides.filter((r) => {
    const d = new Date(r.created_at)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })
  const todayEarnings = todayRides
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.fare_final || 0), 0)
  const completedToday = todayRides.filter((r) => r.status === 'completed').length

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col gap-6">
        <Link href="/driver/map">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Radio className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {driverProfile.is_online ? t('driver.online') : t('driver.goOnline')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {driverProfile.is_online ? t('driver.tapMap') : t('driver.startAccepting')}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={driverProfile.is_online ? 'online' : 'offline'} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('driver.todayRides')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{completedToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('driver.todayEarnings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatUZS(todayEarnings)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('driver.rating')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-1 text-2xl font-bold text-foreground">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                {driverProfile.rating_avg?.toFixed(1) || '5.0'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">{t('driver.wallet')}</p>
              <p className="text-2xl font-bold text-foreground">{formatUZS(driverProfile.wallet_balance || 0)}</p>
            </div>
            <Link href="/driver/wallet">
              <Button variant="outline">{t('driver.viewWallet')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
