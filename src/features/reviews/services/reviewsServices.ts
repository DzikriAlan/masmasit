import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataReviewsBookingRow,
  DataReviewsProjectRow,
  PayloadPostReviewsBooking,
} from '../types/reviewsTypes';

/** Reviews a member received as a project party (project_reviews, 003). */
export const getReviewsProject = async (userId: string) => {
  const query = supabase
    .from('project_reviews')
    .select('id, rating, comment, created_at, profiles:reviewer_id(full_name), projects(title)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });

  return toApiResponse<DataReviewsProjectRow[]>(
    query as unknown as PromiseLike<{ data: DataReviewsProjectRow[] | null; error: null }>,
    'Project reviews retrieved successfully'
  );
};

/** Reviews a talent received from booked sessions (booking_reviews, 031). */
export const getReviewsBooking = async (userId: string) => {
  const query = supabase
    .from('booking_reviews')
    .select('id, rating, comment, created_at, profiles:reviewer_id(full_name)')
    .eq('talent_id', userId)
    .order('created_at', { ascending: false });

  return toApiResponse<DataReviewsBookingRow[]>(
    query as unknown as PromiseLike<{ data: DataReviewsBookingRow[] | null; error: null }>,
    'Session reviews retrieved successfully'
  );
};

/** Booking ids the client already reviewed, to hide the form for them. */
export const getReviewsBookingMine = async (reviewerId: string) => {
  return toApiResponse<{ booking_id: string; rating: number }[]>(
    supabase.from('booking_reviews').select('booking_id, rating').eq('reviewer_id', reviewerId),
    'Your session reviews retrieved successfully'
  );
};

export const postReviewsBooking = async (payload: PayloadPostReviewsBooking) => {
  return toApiResponse<null>(supabase.from('booking_reviews').insert(payload), 'Review submitted successfully');
};
