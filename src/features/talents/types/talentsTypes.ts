export interface Talent {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  linkedin_url: string | null;
  calendly_url: string | null;
  whatsapp: string | null;
  _isDummy?: boolean;
}

export interface TalentProfile {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  linkedin_url: string | null;
  whatsapp: string | null;
  calendly_url: string | null;
  hourly_rate: number | null;
}

export interface BookingSettings {
  talent_admin_fee_percentage: number | string;
  lynkid_bookings_url: string | null;
}

export interface PayloadPostTalentsBooking {
  talent_id: string;
  booking_type: string;
  scheduled_at: string;
  notes: string | null;
  amount: number;
  admin_fee_percentage: number;
  status: string;
  client_id: string | null;
  client_name?: string;
  client_email?: string;
}

export interface DataTalentsBooking {
  id: string;
  booking_type: string;
  scheduled_at: string;
  notes: string | null;
  status: string;
  amount: number;
  payment_status: string;
  created_at: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  profiles: { full_name: string | null } | null;
}
