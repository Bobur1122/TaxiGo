'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createDriverProfile } from '@/lib/actions/drivers'
import { Car } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { DriverProfile } from '@/lib/types'

type DriverOnboardingProps = {
  initialProfile?: Partial<DriverProfile> | null
}

export default function DriverOnboarding({ initialProfile }: DriverOnboardingProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [fullName, setFullName] = useState(initialProfile?.profiles?.full_name || '')
  const [licenseNumber, setLicenseNumber] = useState(initialProfile?.license_number || '')
  const [vehicleModel, setVehicleModel] = useState(initialProfile?.vehicle_model || '')
  const [vehicleColor, setVehicleColor] = useState(initialProfile?.vehicle_color || '')
  const [vehiclePlate, setVehiclePlate] = useState(initialProfile?.vehicle_plate || '')
  const [vehicleClass, setVehicleClass] = useState(initialProfile?.vehicle_class || '')
  const [vehicleYear, setVehicleYear] = useState(initialProfile?.vehicle_year ? String(initialProfile.vehicle_year) : '')
  const [experienceYears, setExperienceYears] = useState(initialProfile?.experience_years ? String(initialProfile.experience_years) : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      if (!fullName.trim()) {
        throw new Error(t('driver.validation.name'))
      }
      if (!vehicleClass) {
        throw new Error(t('driver.validation.class'))
      }
      if (!vehicleYear || Number.isNaN(Number(vehicleYear))) {
        throw new Error(t('driver.validation.year'))
      }
      if (!experienceYears || Number.isNaN(Number(experienceYears))) {
        throw new Error(t('driver.validation.experience'))
      }
      await createDriverProfile({
        full_name: fullName.trim(),
        license_number: licenseNumber,
        vehicle_model: vehicleModel,
        vehicle_color: vehicleColor,
        vehicle_plate: vehiclePlate,
        vehicle_class: vehicleClass,
        vehicle_year: Number(vehicleYear),
        experience_years: Number(experienceYears),
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.actionFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-foreground">{t('driver.onboardingTitle')}</CardTitle>
            <CardDescription>{t('driver.onboardingDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('profile.name')}</Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('driver.namePlaceholder') || 'Ism Familiya'}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('driver.license')}</Label>
                <Input required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="AB 1234567" />
              </div>
              <div className="space-y-2">
                <Label>{t('driver.vehicleModel')}</Label>
                <Input required value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Chevrolet Gentra" />
              </div>
              <div className="space-y-2">
                <Label>{t('driver.vehicleColor')}</Label>
                <Input required value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder={t('driver.colorPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('driver.vehicleClass')}</Label>
                <Select value={vehicleClass} onValueChange={setVehicleClass} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('driver.classPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">{t('tariff.economy')}</SelectItem>
                    <SelectItem value="comfort">{t('tariff.comfort')}</SelectItem>
                    <SelectItem value="business">{t('tariff.business')}</SelectItem>
                    <SelectItem value="xl">{t('tariff.xl')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('driver.vehicleYear')}</Label>
                <Input
                  required
                  type="number"
                  min={1980}
                  max={new Date().getFullYear() + 1}
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  placeholder="2018"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('driver.experience')}</Label>
                <Input
                  required
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('driver.vehiclePlate')}</Label>
                <Input required value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="01 A 123 AB" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('driver.registering') : t('driver.register')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
