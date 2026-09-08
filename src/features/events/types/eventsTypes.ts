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
