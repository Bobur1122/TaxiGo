'use client'

import AppSidebar from '@/components/layout/app-sidebar'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export default function DriverShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useI18n()

  return (
    <div className="flex h-svh overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AppSidebar role="driver" userName={userName} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b px-4 py-3 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('aria.toggleMenu')}</span>
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{t('driver.dashboard')}</h1>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
