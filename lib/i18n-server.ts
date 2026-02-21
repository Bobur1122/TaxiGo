import { cookies, headers } from 'next/headers'
import { translations, type Locale } from './i18n-data'

export async function getLocale(): Promise<Locale> {
  const store = await Promise.resolve(cookies())
  const cookie = store && typeof store.get === 'function'
    ? store.get('taxigo-locale')?.value
    : undefined
  if (cookie === 'uz' || cookie === 'en') return cookie

  const hdrs = await Promise.resolve(headers())
  const raw = hdrs && typeof hdrs.get === 'function' ? hdrs.get('cookie') : ''
  const match = raw?.match(/(?:^|; )taxigo-locale=(uz|en)/)
  if (match?.[1] === 'uz' || match?.[1] === 'en') return match[1]
  return 'uz'
}

export async function tServer(key: string) {
  const locale = await getLocale()
  return translations[locale][key] || key
}
