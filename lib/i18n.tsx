'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { translations, type Locale } from './i18n-data'
import { useRouter } from 'next/navigation'

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'uz',
  setLocale: () => {},
  t: (key: string) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uz')

  useEffect(() => {
    const saved = localStorage.getItem('taxigo-locale') as Locale | null
    if (saved && (saved === 'uz' || saved === 'en')) {
      setLocaleState(saved)
      return
    }
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('taxigo-locale='))
      ?.split('=')[1] as Locale | undefined
    if (cookie === 'uz' || cookie === 'en') {
      setLocaleState(cookie)
      localStorage.setItem('taxigo-locale', cookie)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('taxigo-locale', newLocale)
  }, [])

  const t = useCallback(
    (key: string) => translations[locale][key] || key,
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function LanguageSwitcher() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()
  return (
    <button
      onClick={() => {
        const next = locale === 'uz' ? 'en' : 'uz'
        setLocale(next)
        document.cookie = `taxigo-locale=${next}; path=/; max-age=31536000`
        router.refresh()
      }}
      className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
      {t('lang.switch')}
    </button>
  )
}
