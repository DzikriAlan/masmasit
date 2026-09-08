import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  BookingSettings,
  DataTalentsBooking,
  PayloadPostTalentsBooking,
  Talent,
  TalentProfile,
} from '@/features/talents/types/talentsTypes';

export const getTalents = async () => {
  return toApiResponse<Talent[]>(
    supabase
      .from('profiles')
      .select('id, full_name, bio, avatar_url, location, linkedin_url, calendly_url, whatsapp')
      .eq('is_talent', true)
      .eq('talent_approved', 'approved')
      .order('created_at', { ascending: false }),
    'Talents retrieved successfully'
  );
};

export const getTalentProfile = async (id: string) => {
  return toApiResponse<TalentProfile>(
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    'Talent retrieved successfully'
  );
};

export const getBookingSettings = async () => {
  return toApiResponse<BookingSettings>(
    supabase.from('app_settings').select('talent_admin_fee_percentage, lynkid_bookings_url').maybeSingle(),
    'Booking settings retrieved successfully'
  );
};

export const postTalentsBooking = async (payload: PayloadPostTalentsBooking) => {
  return toApiResponse<{ id: string }>(
    supabase.from('bookings').insert(payload).select('id').single(),
    'Booking created successfully'
  );
};

/** Bookings addressed to this talent. */
export const getTalentsBookings = async (talentId: string) => {
  return toApiResponse<DataTalentsBooking[]>(
    supabase
      .from('bookings')
      .select('*, profiles:client_id(full_name)')
      .eq('talent_id', talentId)
      .order('scheduled_at', { ascending: false }),
    'Bookings retrieved successfully'
  );
};

/** Bookings this member made as a client. */
export const getTalentsMyBookings = async (clientId: string) => {
  return toApiResponse<DataTalentsBooking[]>(
    supabase
      .from('bookings')
      .select('*, profiles:talent_id(full_name)')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false }),
    'Bookings retrieved successfully'
  );
};

export const updateTalentsBookingStatus = async (bookingId: string, status: string) => {
  return toApiResponse<null>(
    supabase.from('bookings').update({ status }).eq('id', bookingId),
    'Booking status updated successfully'
  );
};
