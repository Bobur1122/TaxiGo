'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/lib/i18n'
import { getAllTariffs, updateTariff, type Tariff } from '@/lib/actions/tariffs'
import { Car, Zap, Crown, Truck, Save, Loader2 } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  economy: <Car className="h-5 w-5" />,
  comfort: <Zap className="h-5 w-5" />,
  business: <Crown className="h-5 w-5" />,
  xl: <Truck className="h-5 w-5" />,
}

export default function AdminTariffsPage() {
  const { t } = useI18n()
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Tariff>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getAllTariffs().then(setTariffs)
  }, [])

  const startEdit = (tariff: Tariff) => {
    setEditingId(tariff.id)
    setEditValues({
      base_fare: tariff.base_fare,
      per_km_rate: tariff.per_km_rate,
      per_min_rate: tariff.per_min_rate,
      min_fare: tariff.min_fare,
      multiplier: tariff.multiplier,
      is_active: tariff.is_active,
    })
    setMessage('')
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    const result = await updateTariff(id, editValues)
    if (result.success) {
      setMessage(t('save') + ' OK')
      setEditingId(null)
      const updated = await getAllTariffs()
      setTariffs(updated)
    } else {
      setMessage(result.error || 'Error')
    }
    setSaving(false)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('admin.tariffs')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pricing')}</p>
      </div>

      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {tariffs.map((tariff) => {
          const isEditing = editingId === tariff.id
          return (
            <Card key={tariff.id} className={!tariff.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-primary">{iconMap[tariff.icon] || <Car className="h-5 w-5" />}</div>
                    <CardTitle className="text-lg text-foreground">
                      {t(`tariff.${tariff.icon}`) !== `tariff.${tariff.icon}` ? t(`tariff.${tariff.icon}`) : tariff.name}
                    </CardTitle>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${tariff.id}`} className="text-xs">{t('admin.active')}</Label>
                      <Switch
                        id={`active-${tariff.id}`}
                        checked={editValues.is_active ?? tariff.is_active}
                        onCheckedChange={(v) => setEditValues({ ...editValues, is_active: v })}
                      />
                    </div>
                  ) : (
                    <span className={`text-xs font-medium ${tariff.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {tariff.is_active ? t('admin.active') : 'OFF'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">{t('admin.baseFare')}</Label>
                        <Input type="number" value={editValues.base_fare ?? 0}
                          onChange={(e) => setEditValues({ ...editValues, base_fare: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="text-xs">{t('admin.perKm')}</Label>
                        <Input type="number" value={editValues.per_km_rate ?? 0}
                          onChange={(e) => setEditValues({ ...editValues, per_km_rate: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="text-xs">{t('admin.perMin')}</Label>
                        <Input type="number" value={editValues.per_min_rate ?? 0}
                          onChange={(e) => setEditValues({ ...editValues, per_min_rate: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label className="text-xs">{t('admin.minFare')}</Label>
                        <Input type="number" value={editValues.min_fare ?? 0}
                          onChange={(e) => setEditValues({ ...editValues, min_fare: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">{t('admin.multiplier')}</Label>
                      <Input type="number" step="0.1" value={editValues.multiplier ?? 1}
                        onChange={(e) => setEditValues({ ...editValues, multiplier: Number(e.target.value) })} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(tariff.id)} disabled={saving} className="flex-1">
                        {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                        {t('save')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">{t('cancel')}</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('admin.baseFare')}:</span>
                        <span className="font-medium text-foreground">{tariff.base_fare.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('admin.perKm')}:</span>
                        <span className="font-medium text-foreground">{tariff.per_km_rate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('admin.perMin')}:</span>
                        <span className="font-medium text-foreground">{tariff.per_min_rate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('admin.minFare')}:</span>
                        <span className="font-medium text-foreground">{tariff.min_fare.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => startEdit(tariff)} className="w-full">
                      {t('admin.editTariff')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
