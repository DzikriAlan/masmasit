'use client';

import { useMemo } from 'react';
import { MessageSquareQuote } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { LoadData } from '@/components/load-data';
import { StarRating } from '@/components/review-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useReviewsMemberControllers } from '@/features/reviews/controllers/reviewsControllers';

interface Props {
  userId: string;
}

/**
 * Ratings a member received: project reviews (owner ↔ winning bidder) and
 * session reviews from booking clients. Reusable on /directory/[id] and
 * /talents/[id].
 */
export function MemberReviews({ userId }: Props) {
  const { t } = useLang();
  const { fetchReviewsMember } = useReviewsMemberControllers(userId);

  const data = useMemo(() => {
    const list = fetchReviewsMember.data ?? [];
    const average = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : 0;
    return {
      data: list,
      average,
      averageLabel: average.toFixed(1),
      isLoading: fetchReviewsMember.isPending,
      isError: fetchReviewsMember.isError,
      isEmpty: !fetchReviewsMember.isPending && list.length === 0,
    };
  }, [fetchReviewsMember.data, fetchReviewsMember.isPending, fetchReviewsMember.isError]);

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
          <span className="flex items-center gap-2"><MessageSquareQuote className="h-5 w-5 text-primary" /> {t('Reviews', 'Ulasan')}</span>
          {data.data.length > 0 && (
            <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <StarRating value={Math.round(data.average)} size="sm" /> {data.averageLabel} ({data.data.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LoadData
          hideIcon
          response={{
            isLoading: data.isLoading,
            isError: data.isError,
            isEmpty: data.isEmpty,
            emptyTitle: t('No reviews yet.', 'Belum ada ulasan.'),
            errorTitle: t('Could not load reviews.', 'Gagal memuat ulasan.'),
          }}
        >
          <div className="space-y-3">
            {data.data.map((review) => (
              <div key={`${review.source}-${review.id}`} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">{review.reviewerName ?? t('Member', 'Member')}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {review.source === 'project' ? t('Project', 'Proyek') : t('Session', 'Sesi')}
                    </Badge>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
                {review.subject && <p className="mt-1 text-xs text-muted-foreground">{review.subject}</p>}
                {review.comment && <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        </LoadData>
      </CardContent>
    </Card>
  );
}

export default MemberReviews;
