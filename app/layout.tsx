import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TaxiGo - Online Taxi Booking Platform',
  description: 'Book rides, drive, and manage your taxi business with TaxiGo. Fast, reliable taxi service in Tashkent.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
