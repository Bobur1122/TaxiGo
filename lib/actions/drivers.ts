'use server'

import { createClient } from '@/lib/supabase/server'
import type { DriverProfile } from '@/lib/types'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function getDriverProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('driver_profiles')
    .select('*, profiles(*)')
    .eq('id', user.id)
    .single()

  if (error && error.code === 'PGRST116') return null
  if (error) throw new Error(error.message)
  return data as DriverProfile
}

export async function createDriverProfile(profile: {
  full_name: string
  license_number: string
  vehicle_model: string
  vehicle_color: string
  vehicle_plate: string
  vehicle_class: string
  vehicle_year: number
  experience_years: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Update driver's public profile name using service role if available to bypass RLS.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await admin.from('profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      updated_at: new Date().toISOString(),
      role: 'driver',
    })
  } else {
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profile.full_name,
        updated_at: new Date().toISOString(),
      })
  }

  const { data, error } = await supabase
    .from('driver_profiles')
    .upsert(
      {
        id: user.id,
        ...profile,
        status: 'pending',
        is_online: false,
        rating_avg: 5.0,
        total_rides: 0,
        wallet_balance: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as DriverProfile
}

export async function updateDriverLocation(lat: number, lng: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('driver_profiles')
    .update({
      current_lat: lat,
      current_lng: lng,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
}

export async function toggleOnlineStatus(isOnline: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: driver } = await supabase
    .from('driver_profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!driver || driver.status !== 'approved') {
    throw new Error('Driver is not approved')
  }

  const { data, error } = await supabase
    .from('driver_profiles')
    .update({ is_online: isOnline, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as DriverProfile
}

export async function getNearbyDrivers(lat: number, lng: number) {
  const supabase = await createClient()

  // Get all online, approved drivers
  const { data, error } = await supabase
    .from('driver_profiles')
    .select('*, profiles(*)')
    .eq('is_online', true)
    .eq('status', 'approved')
    .not('current_lat', 'is', null)
    .not('current_lng', 'is', null)

  if (error) throw new Error(error.message)

  // Filter by approximate distance (within ~10km)
  const nearby = (data || []).filter((driver) => {
    if (!driver.current_lat || !driver.current_lng) return false
    const dLat = Math.abs(driver.current_lat - lat)
    const dLng = Math.abs(driver.current_lng - lng)
    return dLat < 0.1 && dLng < 0.1
  })

  return nearby as DriverProfile[]
}

export async function getAllDrivers() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If admin, use service role to bypass RLS reliably
  if (profile?.role === 'admin') {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data, error } = await admin
      .from('driver_profiles')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as DriverProfile[]
  }

  const { data, error } = await supabase
    .from('driver_profiles')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as DriverProfile[]
}

export async function updateDriverStatus(
  driverId: string,
  status: DriverProfile['status'],
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('driver_profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', driverId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as DriverProfile
}

export async function getDriverEarnings() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('rides')
    .select('fare_final, completed_at')
    .eq('driver_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
