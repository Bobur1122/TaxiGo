'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export default function RideRatingForm({ rideId, driverId }: { rideId: string; driverId: string }) {
  const { t } = useI18n()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (rating === 0) return
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('ratings').insert({
        ride_id: rideId,
        from_user_id: user.id,
        to_user_id: driverId,
        rating,
        comment: comment || null,
      })
      router.refresh()
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{t('rides.rateTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  (hover || rating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground',
                )}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder={t('rides.commentPlaceholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting} className="w-full">
          {isSubmitting ? t('rides.submitting') : t('rides.submitRating')}
        </Button>
      </CardContent>
    </Card>
  )
}
