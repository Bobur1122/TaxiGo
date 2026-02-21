'use server'

import { createClient } from '@/lib/supabase/server'

export interface Tariff {
  id: string
  name: string
  icon: string
  base_fare: number
  per_km_rate: number
  per_min_rate: number
  min_fare: number
  multiplier: number
  is_active: boolean
}

export async function getTariffs(): Promise<Tariff[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tariffs')
    .select('*')
    .eq('is_active', true)
    .order('base_fare', { ascending: true })

  if (error) {
    console.error('Error fetching tariffs:', error)
    return []
  }
  return data || []
}

export async function getAllTariffs(): Promise<Tariff[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tariffs')
    .select('*')
    .order('base_fare', { ascending: true })

  if (error) {
    console.error('Error fetching tariffs:', error)
    return []
  }
  return data || []
}

export async function updateTariff(
  id: string,
  updates: Partial<Omit<Tariff, 'id'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tariffs')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
