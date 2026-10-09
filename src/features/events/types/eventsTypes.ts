export interface PayloadPostEvents {
  created_by: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  event_date: string;
  max_capacity: number;
  is_paid: boolean;
  price: number | null;
  region_id: string;
}

export interface PayloadPostEventsRsvp {
  event_id: string;
}

export interface DataEvents {
  id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  event_date: string;
  max_capacity: number;
  is_paid: boolean;
  price: number | null;
  regions: { name: string } | null;
  event_rsvps?: { id: string; user_id: string }[];
  approval_status: string;
  created_by: string | null;
  status?: string;
}

export interface DataEventsDetail extends DataEvents {
  region_id: string;
}

export interface PayloadUpdateEvents {
  title: string;
  description: string;
  event_type: string;
  location: string;
  event_date: string;
  max_capacity: number;
  is_paid: boolean;
  price: number | null;
  region_id: string;
}

export interface DataEventsAttendee {
  rsvp_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  rsvp_status: string;
  payment_status: string;
  registered_at: string;
}

export interface DataEventsMyRsvp {
  id: string;
  payment_status: string;
  payment_note: string | null;
}

export interface DataEventsRegions {
  id: string;
  name: string;
}

export interface Events {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataEvents[] | null;
}
