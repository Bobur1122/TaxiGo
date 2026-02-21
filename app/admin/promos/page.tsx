'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import type { PromoCode } from '@/lib/types'
import { Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatUZS } from '@/lib/map-utils'

export default function AdminPromosPage() {
  const { t } = useI18n()
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent')
  const [discount, setDiscount] = useState('10')
  const [maxUses, setMaxUses] = useState('100')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/promos', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) setPromos(json.data || [])
    }
    load()
  }, [])

  const handleCreate = async () => {
    if (!code) return
    setError('')
    setIsCreating(true)
    try {
      const discountValue = Number(discount)
      const maxUsesValue = Number(maxUses)
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          discount_percent: discountType === 'percent' ? discountValue : null,
          discount_amount: discountType === 'amount' ? discountValue : null,
          max_uses: maxUsesValue,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || t('errors.actionFailed'))
      setCode('')
      setDiscount('10')
      setDiscountType('percent')
      setMaxUses('100')
      setShowForm(false)
      const list = await fetch('/api/admin/promos', { cache: 'no-store' }).then((r) => r.json())
      setPromos(list.data || [])
    } catch {
      setError(t('admin.createFailed'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/promos/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    const list = await fetch('/api/admin/promos', { cache: 'no-store' }).then((r) => r.json())
    setPromos(list.data || [])
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t('admin.promos')}</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> {t('admin.newCode')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-foreground">{t('admin.createPromo')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('admin.code')}</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TAXIGO20" />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.discountType')}</Label>
                <Select value={discountType} onValueChange={(v: 'percent' | 'amount') => setDiscountType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.discountType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">{t('admin.discountPercent')}</SelectItem>
                    <SelectItem value="amount">{t('admin.discountAmount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('admin.maxUses')}</Label>
                <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} min={1} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('admin.discountValue')}</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min={1}
                  max={discountType === 'percent' ? 100 : undefined}
                />
              </div>
              <div className="flex items-end text-sm text-muted-foreground">
                {discountType === 'percent'
                  ? t('admin.percentHint')
                  : t('admin.amountHint')}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? t('admin.creating') : t('admin.create')}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {promos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">{t('admin.noPromos')}</CardContent>
        </Card>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.code')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.discount')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.uses')}</th>
                <th className="pb-2 font-medium text-muted-foreground">{t('admin.status')}</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id} className="border-b last:border-0">
                  <td className="py-3 font-mono font-medium text-foreground">{promo.code}</td>
                  <td className="py-3 text-foreground">
                    {promo.discount_amount
                      ? formatUZS(promo.discount_amount)
                      : `${promo.discount_percent}%`}
                  </td>
                  <td className="py-3 text-foreground">{promo.current_uses} / {promo.max_uses}</td>
                  <td className="py-3">
                    <StatusBadge status={promo.is_active ? 'approved' : 'suspended'} />
                  </td>
                  <td className="py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => handleToggle(promo.id, promo.is_active)}>
                      {promo.is_active ? t('admin.deactivate') : t('admin.activate')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
