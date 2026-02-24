'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { PromoCode, DashboardStats, Profile } from '@/lib/types'

function getAdminClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return null
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getAdminClient() || (await createClient())

  const [ridesRes, driversRes, ridersRes] = await Promise.all([
    supabase.from('rides').select('id, fare_final, status, created_at'),
    supabase.from('driver_profiles').select('id, is_online, status'),
    supabase.from('profiles').select('id').eq('role', 'customer'),
  ])

  const rides = ridesRes.data || []
  const drivers = driversRes.data || []
  const riders = ridersRes.data || []

  const completedRides = rides.filter((r) => r.status === 'completed')
  const totalRevenue = completedRides.reduce(
    (sum, r) => sum + (r.fare_final || 0),
    0,
  )
  const activeDrivers = drivers.filter((d) => d.is_online).length
  const pendingDrivers = drivers.filter((d) => d.status === 'pending').length
  const approvedDrivers = drivers.filter((d) => d.status === 'approved').length

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const today = new Date()

  const ridesThisWeek = rides.filter(
    (r) => new Date(r.created_at) >= oneWeekAgo,
  ).length
  const ridesToday = rides.filter(
    (r) => new Date(r.created_at).toDateString() === today.toDateString(),
  ).length
  const revenueThisWeek = completedRides
    .filter((r) => new Date(r.created_at) >= oneWeekAgo)
    .reduce((sum, r) => sum + (r.fare_final || 0), 0)
  const revenueToday = completedRides
    .filter((r) => new Date(r.created_at).toDateString() === today.toDateString())
    .reduce((sum, r) => sum + (r.fare_final || 0), 0)

  return {
    totalRides: rides.length,
    totalRevenue,
    activeDrivers,
    activeRiders: riders.length,
    ridesThisWeek,
    revenueThisWeek,
    pendingDrivers,
    approvedDrivers,
    ridesToday,
    revenueToday,
  }
}

export async function getRiderSummaries() {
  const supabase = getAdminClient() || (await createClient())

  const { data: riders, error: ridersError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (ridersError) throw new Error(ridersError.message)

  const { data: rides, error: ridesError } = await supabase
    .from('rides')
    .select('customer_id, created_at')
    .order('created_at', { ascending: false })

  if (ridesError) throw new Error(ridesError.message)

  const counts = new Map<string, { count: number; lastRideAt: string }>()
  for (const ride of rides || []) {
    const current = counts.get(ride.customer_id)
    if (!current) {
      counts.set(ride.customer_id, { count: 1, lastRideAt: ride.created_at })
    } else {
      current.count += 1
      if (new Date(ride.created_at) > new Date(current.lastRideAt)) {
        current.lastRideAt = ride.created_at
      }
    }
  }

  return (riders || []).map((rider) => {
    const info = counts.get(rider.id)
    return {
      ...(rider as Profile),
      ride_count: info?.count || 0,
      last_ride_at: info?.lastRideAt || null,
    }
  }) as Array<Profile & { ride_count: number; last_ride_at: string | null }>
}

export async function getRideTrends(days = 7) {
  const supabase = getAdminClient() || (await createClient())
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))

  const { data, error } = await supabase
    .from('rides')
    .select('created_at, fare_final, status')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const buckets = new Map<string, { rides: number; revenue: number }>()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toDateString()
    buckets.set(key, { rides: 0, revenue: 0 })
  }

  for (const ride of data || []) {
    const key = new Date(ride.created_at).toDateString()
    const current = buckets.get(key)
    if (!current) continue
    current.rides += 1
    if (ride.status === 'completed') {
      current.revenue += ride.fare_final || 0
    }
  }

  return Array.from(buckets.entries()).map(([label, values]) => ({
    label,
    rides: values.rides,
    revenue: values.revenue,
  }))
}

export async function getPromoCodes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as PromoCode[]
}

export async function createPromoCode(promo: {
  code: string
  discount_percent?: number
  discount_amount?: number
  max_uses: number
  expires_at?: string
}) {
  const supabase = await createClient()
  if (!promo.discount_percent && !promo.discount_amount) {
    throw new Error('Promo must have percent or amount')
  }
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      ...promo,
      discount_percent: promo.discount_percent || null,
      discount_amount: promo.discount_amount || null,
      is_active: true,
      current_uses: 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PromoCode
}

export async function togglePromoCode(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PromoCode
}
