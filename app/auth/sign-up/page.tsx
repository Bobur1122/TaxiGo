'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Car, User, CarFront } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n, LanguageSwitcher } from '@/lib/i18n'

type Role = 'customer' | 'driver'

export default function SignUpPage() {
  const { t } = useI18n()
  const [role, setRole] = useState<Role>('customer')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            phone,
          },
        },
      })
      if (error) throw error

      if (data.session) {
        const dest = role === 'driver' ? '/driver' : '/customer/book'
        router.push(dest)
        return
      }

      if (data.user) {
        await fetch('/api/auth/confirm-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        })

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        const dest = role === 'driver' ? '/driver' : '/customer/book'
        router.push(dest)
        return
      }

      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">{t('app.name')}</span>
            </div>
            <LanguageSwitcher />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('auth.signupTitle')}</CardTitle>
              <CardDescription>{t('auth.role')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label>{t('auth.role')}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('customer')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                          role === 'customer'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30',
                        )}
                      >
                        <User className={cn('h-6 w-6', role === 'customer' ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('text-sm font-medium', role === 'customer' ? 'text-primary' : 'text-muted-foreground')}>
                          {t('auth.rider')}
                        </span>
                        <span className="text-xs text-muted-foreground">{t('auth.riderDesc')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('driver')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                          role === 'driver'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30',
                        )}
                      >
                        <CarFront className={cn('h-6 w-6', role === 'driver' ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('text-sm font-medium', role === 'driver' ? 'text-primary' : 'text-muted-foreground')}>
                          {t('auth.driver')}
                        </span>
                        <span className="text-xs text-muted-foreground">{t('auth.driverDesc')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                    <Input id="fullName" type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t('auth.phone')}</Label>
                    <Input id="phone" type="tel" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">{t('auth.confirmPassword')}</Label>
                    <Input id="repeat-password" type="password" required value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('auth.processing') : t('auth.signup')}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {t('auth.hasAccount')}{' '}
                  <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">{t('auth.login')}</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
