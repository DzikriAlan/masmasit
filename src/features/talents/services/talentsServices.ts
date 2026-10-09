import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  BookingSettings,
  DataTalentsBooking,
  PayloadPostTalentsBooking,
  Talent,
  TalentProfile,
} from '@/features/talents/types/talentsTypes';

// Guests (anon) may only read the public profile columns granted in
// migration 028 — naming a private one (email, whatsapp, ...) or `*` makes
// PostgREST reject the whole query, so every guest-facing select lists them.
const TALENT_PUBLIC_COLUMNS = 'id, full_name, bio, avatar_url, location, linkedin_url, calendly_url, hourly_rate';

export const getTalents = async () => {
  return toApiResponse<Talent[]>(
    supabase
      .from('profiles')
      .select('id, full_name, bio, avatar_url, location, linkedin_url, calendly_url')
      .eq('is_talent', true)
      .eq('talent_approved', 'approved')
      .order('created_at', { ascending: false }),
    'Talents retrieved successfully'
  );
};

/** Contact details (WhatsApp) are only selected for signed-in members. */
export const getTalentProfile = async (id: string, isSignedIn: boolean) => {
  const columns = isSignedIn ? `${TALENT_PUBLIC_COLUMNS}, whatsapp` : TALENT_PUBLIC_COLUMNS;
  return toApiResponse<TalentProfile>(
    supabase.from('profiles').select(columns).eq('id', id).maybeSingle() as unknown as PromiseLike<{
      data: TalentProfile | null;
      error: { code?: string; message?: string } | null;
    }>,
    'Talent retrieved successfully'
  );
};

/** Confirmed upcoming sessions of a talent (times only), via the 028 RPC. */
export const getTalentsBookedSlots = async (talentId: string) => {
  return toApiResponse<{ scheduled_at: string }[]>(
    supabase.rpc('get_talent_booked_slots', { p_talent_id: talentId }),
    'Booked slots retrieved successfully'
  );
};

export const getBookingSettings = async () => {
  return toApiResponse<BookingSettings>(
    supabase.from('app_settings').select('talent_admin_fee_percentage, goakal_bookings_url').maybeSingle(),
    'Booking settings retrieved successfully'
  );
};

/**
 * Guests have no SELECT on bookings, so `insert().select()` fails for them
 * after the row is written. The id is generated here instead and the insert
 * asks for no representation back.
 */
export const postTalentsBooking = async (payload: PayloadPostTalentsBooking) => {
  const id = crypto.randomUUID();
  return toApiResponse<{ id: string }>(
    supabase
      .from('bookings')
      .insert({ ...payload, id })
      .then(({ error }) => ({ data: error ? null : { id }, error })),
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
