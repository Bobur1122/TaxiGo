'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

export default function CustomerProfilePage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { t } = useI18n()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
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
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">{t('profile.title')}</CardTitle>
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
      </div>
    </div>
  )
}
