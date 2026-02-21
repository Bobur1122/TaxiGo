'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatUZS } from '@/lib/map-utils'
import { Wallet, ArrowDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { requestWithdrawal } from '@/lib/actions/withdrawals'
import { useI18n } from '@/lib/i18n'

const fetcher = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: dp } = await supabase
    .from('driver_profiles')
    .select('wallet_balance, total_rides, rating_avg')
    .eq('id', user.id)
    .single()

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return { profile: dp, withdrawals: withdrawals || [] }
}

export default function DriverWalletPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { data, mutate } = useSWR('wallet', fetcher, { refreshInterval: 5000 })
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [fullName, setFullName] = useState('')

  const handleWithdraw = async () => {
    if (!withdrawAmount || !phoneNumber || !cardNumber || !fullName) {
      alert(t('withdraw.error.fillAll'))
      return
    }

    const amount = parseInt(withdrawAmount)
    if (amount <= 0) {
      alert(t('withdraw.error.amount'))
      return
    }

    if (amount > (data?.profile?.wallet_balance || 0)) {
      alert(t('withdraw.error.insufficient'))
      return
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      alert(t('withdraw.error.cardDigits'))
      return
    }

    setIsSubmitting(true)
    try {
      await requestWithdrawal(amount, phoneNumber, cardNumber, fullName)
      setWithdrawAmount('')
      setPhoneNumber('')
      setCardNumber('')
      setFullName('')
      await mutate()
      alert(t('withdraw.success'))
    } catch (err) {
      alert(t('withdraw.error.submit'))
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!data) return <div className="p-4">{t('loading')}</div>

  const balance = data.profile?.wallet_balance || 0

  return (
    <div className="p-4 lg:p-6">
      <h2 className="mb-6 text-2xl font-semibold text-foreground">{t('driver.wallet')}</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>{t('driver.wallet')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{formatUZS(balance)}</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">{t('admin.totalRides')}</p>
                <p className="text-2xl font-bold text-foreground">{data.profile?.total_rides || 0}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">{t('driver.rating')}</p>
                <p className="text-2xl font-bold text-foreground">{data.profile?.rating_avg?.toFixed(1) || '5.0'} ⭐</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('withdraw.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">{t('withdraw.amount')}</label>
              <input
                type="number"
                min="10000"
                step="1000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={t('withdraw.amountPlaceholder')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('withdraw.max')} {formatUZS(balance)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">{t('profile.name')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('withdraw.namePlaceholder')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('withdraw.nameHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">{t('withdraw.card')}</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  let val = e.target.value.replace(/\s/g, '')
                  val = val.replace(/(\d{4})/g, '$1 ').trim()
                  setCardNumber(val)
                }}
                placeholder={t('withdraw.cardPlaceholder')}
                maxLength="19"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('withdraw.cardHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">{t('profile.phone')}</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('withdraw.phonePlaceholder')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('withdraw.phoneHint')}</p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={isSubmitting || !withdrawAmount || !phoneNumber || !cardNumber || !fullName || balance === 0}
              className="w-full"
            >
              {isSubmitting ? t('withdraw.processing') : t('withdraw.request')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      {data.withdrawals && data.withdrawals.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('withdraw.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-foreground">{formatUZS(w.amount)}</p>
                    <p className="text-sm text-muted-foreground">{w.phone_number}</p>
                  </div>
                  <span className={`text-sm font-medium ${w.status === 'completed' ? 'text-green-600' : w.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {w.status === 'completed'
                      ? t('withdraw.status.completed')
                      : w.status === 'pending'
                        ? t('withdraw.status.pending')
                        : t('withdraw.status.rejected')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
