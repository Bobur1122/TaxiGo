'use server'

import { createClient } from '@/lib/supabase/server'
import type { Ride } from '@/lib/types'

export async function createRide(data: {
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  fare_estimate: number
  distance_km: number
  duration_min: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: ride, error } = await supabase
    .from('rides')
    .insert({
      customer_id: user.id,
      ...data,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return ride as Ride
}

export async function getMyRides(limit = 50) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const role = user.user_metadata?.role

  let query = supabase
    .from('rides')
    .select('*, profiles!rides_customer_id_fkey(*), driver_profiles(*, profiles(*))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (role === 'customer') {
    query = query.eq('customer_id', user.id)
  } else if (role === 'driver') {
    query = query.eq('driver_id', user.id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as Ride[]
}

export async function getRide(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rides')
    .select('*, profiles!rides_customer_id_fkey(*), driver_profiles(*, profiles(*))')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Ride
}

export async function acceptRide(rideId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: driverProfile } = await supabase
    .from('driver_profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!driverProfile || driverProfile.status !== 'approved') {
    throw new Error('Driver not approved')
  }

  const { data, error } = await supabase
    .from('rides')
    .update({
      driver_id: user.id,
      status: 'accepted',
    })
    .eq('id', rideId)
    .eq('status', 'pending')
    .select('*, profiles!rides_customer_id_fkey(*)')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error('Ride was already accepted by another driver or does not exist')
  }
  return data[0] as Ride
}

export async function updateRideStatus(
  rideId: string,
  status: Ride['status'],
) {
  const supabase = await createClient()
  const updateData: Record<string, unknown> = { status }

  if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString()
  }
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('rides')
    .update(updateData)
    .eq('id', rideId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Add payment to driver's wallet when ride is completed
  const payoutAmount = data.fare_final || data.fare_estimate
  if (status === 'completed' && data.driver_id && payoutAmount) {
    try {
      await supabase.rpc('add_driver_earnings', {
        driver_id: data.driver_id,
        amount: payoutAmount,
        ride_id: rideId,
      })
    } catch (err) {
      console.error('[v0] Failed to add driver earnings:', err)
    }
  }

  return data as Ride
}

export async function cancelRide(rideId: string) {
  return updateRideStatus(rideId, 'cancelled')
}

export async function getPendingRides() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rides')
    .select('*, profiles!rides_customer_id_fkey(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as Ride[]
}

export async function getActiveRide() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.user_metadata?.role
  const activeStatuses = ['pending', 'accepted', 'arriving', 'in_progress']

  let query = supabase
    .from('rides')
    .select('*, profiles!rides_customer_id_fkey(*), driver_profiles(*, profiles(*))')
    .in('status', activeStatuses)
    .order('created_at', { ascending: false })
    .limit(1)

  if (role === 'customer') {
    query = query.eq('customer_id', user.id)
  } else if (role === 'driver') {
    query = query.eq('driver_id', user.id)
  }

  const { data, error } = await query
  if (error) return null
  return data?.[0] as Ride | null
}

export async function setRideFare(rideId: string, fareFinal: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rides')
    .update({ fare_final: fareFinal })
    .eq('id', rideId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Ride
}

export async function getAllRides(limit = 100) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rides')
    .select('*, profiles!rides_customer_id_fkey(*), driver_profiles(*, profiles(*)), tariffs(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data || []) as Ride[]
}
