import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      access_token,
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
      fare_estimate,
      distance_km,
      duration_min,
      tariff_id,
      promo_code,
    } = body

    if (!access_token) return NextResponse.json({ error: 'Missing access token' }, { status: 401 })
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Server promo config missing' }, { status: 500 })
    }

    const anon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: auth, error: authError } = await anon.auth.getUser(access_token)
    if (authError || !auth?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    const userId = auth.user.id

    const admin = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Validate promo (single use per user, respect max_uses, allow reuse after cancel)
    if (promo_code) {
      const { data: promo, error: promoError } = await admin
        .from('promo_codes')
        .select('*')
        .eq('code', promo_code)
        .eq('is_active', true)
        .single()
      if (promoError || !promo) {
        return NextResponse.json({ error: 'Promo not found' }, { status: 400 })
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Promo expired' }, { status: 400 })
      }
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        return NextResponse.json({ error: 'Promo usage limit reached' }, { status: 400 })
      }

      const { count: alreadyUsed } = await admin
        .from('rides')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .eq('promo_code', promo_code)
        .neq('status', 'cancelled')
      if ((alreadyUsed || 0) > 0) {
        return NextResponse.json({ error: 'Promo already used by this account' }, { status: 400 })
      }
    }

    // Insert ride using service role to avoid RLS issues
    const { data: ride, error: insertError } = await admin
      .from('rides')
      .insert({
        customer_id: userId,
        pickup_address,
        pickup_lat,
        pickup_lng,
        dropoff_address,
        dropoff_lat,
        dropoff_lng,
        fare_estimate,
        distance_km,
        duration_min,
        status: 'pending',
        tariff_id,
        promo_code: promo_code || null,
      })
      .select('id')
      .single()

    if (insertError || !ride) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create ride' }, { status: 500 })
    }

    if (promo_code) {
      // Atomic-ish increment after insert; tolerable for small scale
      const { data: promo } = await admin
        .from('promo_codes')
        .select('id, current_uses, max_uses')
        .eq('code', promo_code)
        .single()
      if (promo) {
        const nextUses = (promo.current_uses || 0) + 1
        if (!promo.max_uses || nextUses <= promo.max_uses) {
          await admin.from('promo_codes').update({ current_uses: nextUses }).eq('id', promo.id)
        }
      }
    }

    return NextResponse.json({ rideId: ride.id })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
