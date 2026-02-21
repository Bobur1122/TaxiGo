import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedPrefixes = ['/customer', '/driver', '/admin']
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and visiting auth pages, redirect to their dashboard
  if (user && pathname.startsWith('/auth')) {
    const role = user.user_metadata?.role || 'customer'
    const url = request.nextUrl.clone()
    url.pathname = role === 'admin' ? '/admin' : role === 'driver' ? '/driver' : '/customer/book'
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user && isProtectedRoute) {
    const role = user.user_metadata?.role || 'customer'

    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'driver' ? '/driver' : '/customer'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/driver') && role !== 'driver') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin' : '/customer'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/customer') && role !== 'customer') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin' : '/driver'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
