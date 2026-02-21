import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tariffs')
    .select('*')
    .eq('is_active', true)
    .order('base_fare', { ascending: true })

  if (error) {
    return NextResponse.json([], { status: 500 })
  }
  return NextResponse.json(data || [])
}
