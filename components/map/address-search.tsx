'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { geocodeAddress } from '@/lib/map-utils'
import { MapPin } from 'lucide-react'

interface AddressSearchProps {
  label: string
  placeholder?: string
  onSelect: (lat: number, lng: number, address: string) => void
  value?: string
}

export default function AddressSearch({
  label,
  placeholder = 'Search address...',
  onSelect,
  value = '',
}: AddressSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<
    { lat: number; lng: number; display_name: string }[]
  >([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }
    setIsSearching(true)
    try {
      const data = await geocodeAddress(q)
      setResults(data)
      setIsOpen(data.length > 0)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleInputChange = (val: string) => {
    setQuery(val)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => search(val), 500)
  }

  return (
    <div ref={containerRef} className="relative">
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                setQuery(r.display_name)
                setIsOpen(false)
                onSelect(r.lat, r.lng, r.display_name)
              }}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
