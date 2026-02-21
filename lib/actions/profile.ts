'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export async function getProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data as Profile
}

export async function updateProfile(updates: {
  full_name?: string
  phone?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Profile
}

export async function getAllProfiles(role?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as Profile[]
}
