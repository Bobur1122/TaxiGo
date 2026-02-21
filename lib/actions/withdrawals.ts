'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestWithdrawal(
  amount: number,
  phoneNumber: string,
  cardNumber: string,
  fullName: string,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (amount <= 0) throw new Error('Amount must be greater than 0')
  if (amount < 50000) throw new Error('Minimum withdrawal amount is 50,000 UZS')
  if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
    throw new Error('Invalid card number')
  }
  if (!fullName || fullName.trim().length === 0) {
    throw new Error('Full name is required')
  }

  // Get driver profile
  const { data: dp, error: dpError } = await supabase
    .from('driver_profiles')
    .select('wallet_balance')
    .eq('id', user.id)
    .single()

  if (dpError || !dp) throw new Error('Driver profile not found')
  if (dp.wallet_balance < amount) throw new Error('Insufficient wallet balance')

  // Create withdrawal record
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      driver_id: user.id,
      amount,
      phone_number: phoneNumber,
      card_number: cardNumber.replace(/\s/g, ''),
      full_name: fullName,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Deduct from wallet
  await supabase
    .from('driver_profiles')
    .update({
      wallet_balance: dp.wallet_balance - amount,
    })
    .eq('id', user.id)

  return data
}

export async function getWithdrawals() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
