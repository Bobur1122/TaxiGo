import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// THIS ENDPOINT IS FOR DEVELOPMENT ONLY
// DO NOT USE IN PRODUCTION - Remove this endpoint before deploying

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Use service role to create user with admin role
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        role: 'admin',
        full_name: fullName || 'Admin',
        phone: phone || '',
      },
      email_confirm: true, // Auto-confirm email
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: data.user,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
