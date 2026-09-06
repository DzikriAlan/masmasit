import { supabase } from '@/shared/lib/supabase';
import type { PayloadPostTalentsBooking } from '@/features/talents/types/talentsTypes';

export const getTalents = async () => {
  return supabase
    .from('profiles')
    .select('id, full_name, bio, avatar_url, location, linkedin_url, calendly_url, whatsapp')
    .eq('is_talent', true)
    .eq('talent_approved', 'approved')
    .order('created_at', { ascending: false });
};

export const getTalentProfile = async (id: string) => {
  return supabase.from('profiles').select('*').eq('id', id).maybeSingle();
};

export const getBookingSettings = async () => {
  return supabase.from('app_settings').select('talent_admin_fee_percentage, lynkid_bookings_url').maybeSingle();
};

export const postTalentsBooking = async (payload: PayloadPostTalentsBooking) => {
  return supabase.from('bookings').insert(payload).select('id').single();
};
