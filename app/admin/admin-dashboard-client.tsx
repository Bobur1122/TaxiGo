'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatUZS } from '@/lib/map-utils'
import { Car, DollarSign, Users, TrendingUp, CheckCircle2, Clock, Activity } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import type { DashboardStats, Ride } from '@/lib/types'

type TrendPoint = {
  label: string
  rides: number
  revenue: number
}

export default function AdminDashboardClient({
  stats,
  recentRides,
  rideTrends,
  todayLabel,
}: {
  stats: DashboardStats
  recentRides: Ride[]
  rideTrends: TrendPoint[]
  todayLabel: string
}) {
  const { t, locale } = useI18n()

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('admin.crmTitle')}</p>
              <h1 className="text-2xl font-bold text-foreground">{t('admin.crmSubtitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('admin.crmSnapshot')} {todayLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4" />
              {t('admin.liveUpdate')}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalRides')}</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.totalRides}</p>
              <p className="text-xs text-muted-foreground">{stats.ridesThisWeek} {t('admin.thisWeek')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalRevenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatUZS(stats.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">{formatUZS(stats.revenueThisWeek)} {t('admin.thisWeek')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.activeDrivers')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.activeDrivers}</p>
              <p className="text-xs text-muted-foreground">{t('admin.onlineNow')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalRiders')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.activeRiders}</p>
              <p className="text-xs text-muted-foreground">{t('admin.registeredCustomers')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">{t('admin.recentRides')}</CardTitle>
                <Link href="/admin/rides" className="text-sm text-primary underline underline-offset-4">{t('admin.viewAll')}</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">{t('admin.pickup')}</th>
                      <th className="pb-2 font-medium text-muted-foreground">{t('admin.dropoff')}</th>
                      <th className="pb-2 font-medium text-muted-foreground">{t('admin.status')}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t('admin.fare')}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t('admin.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRides.map((ride) => (
                      <tr key={ride.id} className="border-b last:border-0">
                        <td className="max-w-[180px] truncate py-2 text-foreground">{ride.pickup_address}</td>
                        <td className="max-w-[180px] truncate py-2 text-foreground">{ride.dropoff_address}</td>
                        <td className="py-2"><StatusBadge status={ride.status} /></td>
                        <td className="py-2 text-right font-medium text-foreground">{formatUZS(ride.fare_final || ride.fare_estimate || 0)}</td>
                        <td className="py-2 text-right text-muted-foreground">{new Date(ride.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'uz-UZ')}</td>
                      </tr>
                    ))}
                    {recentRides.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{t('admin.noRides')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.today')}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('admin.rides')}</span>
                  <span className="font-semibold text-foreground">{stats.ridesToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('admin.revenue')}</span>
                  <span className="font-semibold text-foreground">{formatUZS(stats.revenueToday)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.driverApprovals')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('admin.pending')}</span>
                  <span className="font-semibold text-foreground">{stats.pendingDrivers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('admin.approved')}</span>
                  <span className="font-semibold text-foreground">{stats.approvedDrivers}</span>
                </div>
                <Link href="/admin/drivers" className="inline-flex text-xs text-primary underline underline-offset-4">{t('admin.reviewDrivers')}</Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.ridesTrend')}</CardTitle>
              </CardHeader>
              <CardContent className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rideTrends} margin={{ left: -8, right: 8, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ridesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={false} />
                    <YAxis allowDecimals={false} width={30} />
                    <Tooltip formatter={(value) => [value, t('admin.rides')]} />
                    <Area type="monotone" dataKey="rides" stroke="#10b981" fill="url(#ridesGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.revenueTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rideTrends} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={false} />
                <YAxis width={60} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(value) => [formatUZS(Number(value)), t('admin.revenue')]} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
