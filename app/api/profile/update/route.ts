import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { access_token, full_name, phone } = await request.json()
    if (!access_token) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 })
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: auth, error: authError } = await anon.auth.getUser(access_token)
    if (authError || !auth?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await admin
      .from('profiles')
      .upsert(
        { id: auth.user.id, full_name, phone, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
