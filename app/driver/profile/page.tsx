'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { useI18n } from '@/lib/i18n'

export default function DriverProfilePage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [driverInfo, setDriverInfo] = useState<Record<string, string | null>>({})
  const [driverStatus, setDriverStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { t } = useI18n()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
      }

      const { data: dp } = await supabase.from('driver_profiles').select('*').eq('id', user.id).single()
      if (dp) {
        setDriverInfo({
          license_number: dp.license_number,
          vehicle_model: dp.vehicle_model,
          vehicle_color: dp.vehicle_color,
          vehicle_plate: dp.vehicle_plate,
          vehicle_class: dp.vehicle_class,
          vehicle_year: dp.vehicle_year ? String(dp.vehicle_year) : null,
          experience_years: dp.experience_years ? String(dp.experience_years) : null,
        })
        setDriverStatus(dp.status)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: session.access_token,
          full_name: fullName,
          phone,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || t('profile.saveFailed'))
      setMessage(t('profile.saved'))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('profile.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">{t('profile.title')}</CardTitle>
              {driverStatus && <StatusBadge status={driverStatus} />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('profile.email')}</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('profile.name')}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('profile.phone')}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? t('profile.saving') : t('profile.update')}
            </Button>
          </CardContent>
        </Card>

        {Object.keys(driverInfo).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-foreground">{t('driver.onboarding')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(driverInfo).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="capitalize text-muted-foreground">
                    {{
                      license_number: t('driver.license'),
                      vehicle_model: t('driver.vehicleModel'),
                      vehicle_color: t('driver.vehicleColor'),
                      vehicle_plate: t('driver.vehiclePlate'),
                      vehicle_class: t('driver.vehicleClass'),
                      vehicle_year: t('driver.vehicleYear'),
                      experience_years: t('driver.experience'),
                    }[key] || key.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-foreground">{val || '-'}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
