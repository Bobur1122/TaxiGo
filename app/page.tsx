'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Car, MapPin, Shield, Clock, Star, Users, ArrowRight } from 'lucide-react'
import { useI18n, LanguageSwitcher } from '@/lib/i18n'
import { reverseGeocode } from '@/lib/map-utils'

export default function LandingPage() {
  const { t } = useI18n()
  const [user, setUser] = useState<{ role?: string } | null>(null)
  const [locationLabel, setLocationLabel] = useState(t('landing.location'))
  const [hasResolvedLocation, setHasResolvedLocation] = useState(false)

  const formatLocationLabel = (address: string) => {
    const parts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
    }
    return address
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ role: data.user.user_metadata?.role })
      }
    })
  }, [])

  useEffect(() => {
    if (!hasResolvedLocation) {
      setLocationLabel(t('landing.location'))
    }
  }, [t, hasResolvedLocation])

  useEffect(() => {
    if (!navigator.geolocation) return

    let isActive = true
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (isActive) {
            setLocationLabel(formatLocationLabel(address))
            setHasResolvedLocation(true)
          }
        } catch {
          // Keep default location label on failure
        }
      },
      () => {
        // Keep default location label when permission is denied or fails
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    )

    return () => {
      isActive = false
    }
  }, [])

  const dashboardLink = user
    ? `/${user.role === 'driver' ? 'driver' : user.role === 'admin' ? 'admin' : 'customer/book'}`
    : '/auth/login'

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href={dashboardLink}>
                <Button>{t('nav.dashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">{t('auth.login')}</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button>{t('auth.signup')}</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center lg:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {locationLabel}
        </div>
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground lg:text-6xl">
          {t('landing.hero')}
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
          {t('landing.heroDesc')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2 px-8">
              {t('landing.bookNow')} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="outline" className="px-8">
              {t('landing.becomeDriver')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">{t('landing.features')}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Clock className="h-6 w-6" />, title: t('landing.fast'), desc: t('landing.fastDesc') },
              { icon: <Shield className="h-6 w-6" />, title: t('landing.safe'), desc: t('landing.safeDesc') },
              { icon: <Star className="h-6 w-6" />, title: t('landing.affordable'), desc: t('landing.affordableDesc') },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-background p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">{t('landing.howItWorks')}</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: t('landing.step1'), desc: t('landing.step1Desc') },
              { step: '2', title: t('landing.step2'), desc: t('landing.step2Desc') },
              { step: '3', title: t('landing.step3'), desc: t('landing.step3Desc') },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">{t('landing.bookNow')}</h2>
          <p className="mb-8 text-primary-foreground/80">{t('landing.heroDesc')}</p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary" className="px-8">{t('auth.signup')}</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('app.name')} - {t('app.tagline')}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('landing.stack')}</p>
          
        </div>
      </footer>
    </div>
  )
}
