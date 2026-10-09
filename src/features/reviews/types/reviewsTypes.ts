export interface DataReviewsMember {
  id: string;
  source: 'project' | 'booking';
  rating: number;
  comment: string | null;
  created_at: string;
  reviewerName: string | null;
  /** Project title for project reviews, null for session reviews. */
  subject: string | null;
}

export interface DataReviewsProjectRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
  projects: { title: string } | null;
}

export interface DataReviewsBookingRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export interface PayloadPostReviewsBooking {
  booking_id: string;
  reviewer_id: string;
  talent_id: string;
  rating: number;
  comment: string | null;
}

export interface ReviewsMember {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataReviewsMember[] | null;
}
