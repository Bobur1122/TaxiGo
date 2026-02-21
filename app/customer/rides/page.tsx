import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatUZS } from '@/lib/map-utils'
import { History } from 'lucide-react'
import CustomerRidesClient from './customer-rides-client'
import { tServer } from '@/lib/i18n-server'

export default async function CustomerRidesPage() {
  const [tTitle, tNoRides, tOrderRide] = await Promise.all([
    tServer('rides.title'),
    tServer('rides.noRides'),
    tServer('book.orderRide'),
  ])
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rides } = await supabase
    .from('rides')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  const allRides = rides || []

  return (
    <div className="p-4 lg:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{tTitle}</h2>
      {allRides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <History className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{tNoRides}</p>
            <Link href="/customer/book" className="text-sm font-medium text-primary underline underline-offset-4">
              {tOrderRide}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <CustomerRidesClient rides={allRides} />
      )}
    </div>
  )
}
