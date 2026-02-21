import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const reverse = searchParams.get('reverse')

  if (reverse === 'true') {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing lat/lng' },
        { status: 400 },
      )
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'TaxiGo/1.0' } },
    )
    const data = await res.json()
    return NextResponse.json(data)
  }

  const q = searchParams.get('q')
  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  }

  const format = searchParams.get('format') || 'json'
  const limit = searchParams.get('limit') || '5'
  const countrycodes = searchParams.get('countrycodes') || 'uz'

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=${format}&limit=${limit}&countrycodes=${countrycodes}`,
    { headers: { 'User-Agent': 'TaxiGo/1.0' } },
  )
  const data = await res.json()
  return NextResponse.json(data)
}
