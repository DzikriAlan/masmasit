import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getReviewsBooking,
  getReviewsBookingMine,
  getReviewsProject,
  postReviewsBooking,
} from '../services/reviewsServices';
import type { DataReviewsMember, PayloadPostReviewsBooking } from '../types/reviewsTypes';

/** Project + session reviews a member received, newest first. */
export const useReviewsMemberControllers = (userId: string | undefined) => {
  const fetchReviewsMember = useQuery({
    queryKey: ['memberReviews', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      // A missing booking_reviews table (031 not applied) must not hide the
      // project reviews, so the two sources fail independently.
      const [projectRes, bookingRes] = await Promise.all([
        getReviewsProject(userId as string),
        getReviewsBooking(userId as string),
      ]);
      const projectRows = projectRes.success ? projectRes.data ?? [] : [];
      const bookingRows = bookingRes.success ? bookingRes.data ?? [] : [];
      if (!projectRes.success && !bookingRes.success) unwrapApiResponse(projectRes);

      const merged: DataReviewsMember[] = [
        ...projectRows.map((r) => ({
          id: r.id,
          source: 'project' as const,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewerName: r.profiles?.full_name ?? null,
          subject: r.projects?.title ?? null,
        })),
        ...bookingRows.map((r) => ({
          id: r.id,
          source: 'booking' as const,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewerName: r.profiles?.full_name ?? null,
          subject: null,
        })),
      ];
      return merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  });

  return { fetchReviewsMember };
};

/** Client side of session reviews (TC-06-06). */
export const useReviewsBookingControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const fetchReviewsBookingMine = useQuery({
    queryKey: ['bookingReviewsMine', userId],
    queryFn: async () => unwrapApiResponse(await getReviewsBookingMine(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const storeReviewsBooking = useMutation({
    mutationFn: async (payload: PayloadPostReviewsBooking) => unwrapApiResponse(await postReviewsBooking(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingReviewsMine', userId] });
      queryClient.invalidateQueries({ queryKey: ['memberReviews'] });
    },
  });

  return { fetchReviewsBookingMine, storeReviewsBooking };
};
