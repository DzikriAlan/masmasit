'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

interface StarRatingProps {
  value: number;
  /** Omit for a read-only display. */
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
}

/** 1–5 stars; interactive when `onChange` is given. */
export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const { t } = useLang();
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-6 w-6';

  return (
    <div className="flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={t(`${value} of 5 stars`, `${value} dari 5 bintang`)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star className={cn(iconClass, n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />;
        if (!onChange) return <span key={n}>{icon}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={t(`${n} star`, `${n} bintang`)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

interface ReviewFormProps {
  title: string;
  submitting?: boolean;
  onSubmitReview: (review: { rating: number; comment: string }) => void;
}

/** Rating (1–5) + optional written review. The parent owns the write. */
export function ReviewForm({ title, submitting, onSubmitReview }: ReviewFormProps) {
  const { t } = useLang();
  const [form, setForm] = useState({ rating: 0, comment: '' });

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-4">
      <p className="text-sm font-medium">{title}</p>
      <StarRating value={form.rating} onChange={(rating) => setForm((prev) => ({ ...prev, rating }))} />
      <Textarea
        value={form.comment}
        onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
        placeholder={t('Share how it went (optional)', 'Ceritakan pengalaman Anda (opsional)')}
        className="min-h-[70px]"
      />
      <Button
        size="sm"
        disabled={submitting || form.rating < 1}
        onClick={() => onSubmitReview({ rating: form.rating, comment: form.comment.trim() })}
        className="gap-2"
      >
        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {t('Submit review', 'Kirim ulasan')}
      </Button>
    </div>
  );
}
