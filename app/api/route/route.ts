import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const from_lat = searchParams.get('from_lat')
  const from_lng = searchParams.get('from_lng')
  const to_lat = searchParams.get('to_lat')
  const to_lng = searchParams.get('to_lng')

  if (!from_lat || !from_lng || !to_lat || !to_lng) {
    return NextResponse.json(
      { error: 'Missing coordinates' },
      { status: 400 },
    )
  }

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from_lng},${from_lat};${to_lng},${to_lat}?overview=full&geometries=geojson`,
      { headers: { 'User-Agent': 'TaxiGo/1.0' } },
    )

    const data = await res.json()

    if (data.code !== 'Ok' || !data.routes?.[0]) {
      return NextResponse.json(
        { error: 'No route found' },
        { status: 404 },
      )
    }

    const route = data.routes[0]
    const geometry = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] as [number, number],
    )

    return NextResponse.json({
      distance_km: Math.round((route.distance / 1000) * 10) / 10,
      duration_min: Math.round(route.duration / 60),
      geometry,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 },
    )
  }
}
