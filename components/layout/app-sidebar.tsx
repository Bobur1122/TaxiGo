'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Car,
  LayoutDashboard,
  MapPinned,
  History,
  User,
  Users,
  DollarSign,
  Tag,
  Settings,
  LogOut,
  Wallet,
  TrendingUp,
  Radio,
} from 'lucide-react'
import type { UserRole } from '@/lib/types'
import { useI18n, LanguageSwitcher } from '@/lib/i18n'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ReactNode
}

const customerNav: NavItem[] = [
  { href: '/customer', labelKey: 'nav.dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/customer/book', labelKey: 'nav.book', icon: <MapPinned className="h-4 w-4" /> },
  { href: '/customer/rides', labelKey: 'nav.rides', icon: <History className="h-4 w-4" /> },
  { href: '/customer/profile', labelKey: 'nav.profile', icon: <User className="h-4 w-4" /> },
]

const driverNav: NavItem[] = [
  { href: '/driver', labelKey: 'nav.dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/driver/map', labelKey: 'driver.map', icon: <Radio className="h-4 w-4" /> },
  { href: '/driver/rides', labelKey: 'driver.rides', icon: <History className="h-4 w-4" /> },
  { href: '/driver/earnings', labelKey: 'driver.earnings', icon: <TrendingUp className="h-4 w-4" /> },
  { href: '/driver/wallet', labelKey: 'driver.wallet', icon: <Wallet className="h-4 w-4" /> },
  { href: '/driver/profile', labelKey: 'profile', icon: <Settings className="h-4 w-4" /> },
]

const adminNav: NavItem[] = [
  { href: '/admin', labelKey: 'nav.dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/admin/drivers', labelKey: 'admin.drivers', icon: <Car className="h-4 w-4" /> },
  { href: '/admin/riders', labelKey: 'admin.riders', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/rides', labelKey: 'admin.rides', icon: <History className="h-4 w-4" /> },
  { href: '/admin/pricing', labelKey: 'admin.tariffs', icon: <DollarSign className="h-4 w-4" /> },
  { href: '/admin/promos', labelKey: 'admin.promos', icon: <Tag className="h-4 w-4" /> },
]

const navMap: Record<UserRole, NavItem[]> = {
  customer: customerNav,
  driver: driverNav,
  admin: adminNav,
}

interface AppSidebarProps {
  role: UserRole
  userName?: string
}

export default function AppSidebar({ role, userName }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const items = navMap[role] || customerNav

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const roleLabel =
    role === 'admin' ? t('admin.dashboard') : role === 'driver' ? t('driver.dashboard') : t('auth.rider')

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Car className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">{t('app.name')}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive =
            item.href === `/${role}`
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
              )}
            >
              {item.icon}
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      <div className="border-t px-3 py-4">
        {userName && (
          <p className="mb-2 truncate px-3 text-sm font-medium text-sidebar-foreground">
            {userName}
          </p>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </Button>
      </div>
    </aside>
  )
}
