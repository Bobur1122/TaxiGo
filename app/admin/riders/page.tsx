import { getRiderSummaries } from '@/lib/actions/admin'
import AdminRidersClient from './admin-riders-client'

export default async function AdminRidersPage() {
  const riders = await getRiderSummaries()

  return <AdminRidersClient riders={riders} />
}
