export interface DataAgencyServices {
  id: string;
  category: string;
  title: string;
  description: string;
  base_price: number | null;
  is_active: boolean;
}

export interface DataAgency {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string;
  is_in_house: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  // Agency's own WhatsApp (digits, country code first) — migration 032.
  whatsapp: string | null;
  created_at: string;
}

export interface DataAgencyDetail extends DataAgency {
  agency_services: DataAgencyServices[];
}

export interface PayloadPostAgency {
  owner_id: string;
  name: string;
  logo_url: string;
  description: string;
}

export interface PayloadPatchAgencyManage {
  id: string;
  name: string;
  description: string;
  whatsapp: string | null;
  logo_url: string | null;
}

export interface PayloadPostAgencyServices {
  agency_id: string;
  title: string;
  category: string;
  description: string;
  base_price: number | null;
  is_active: boolean;
}

export interface PayloadPatchAgencyServices {
  id: string;
  title?: string;
  category?: string;
  description?: string;
  base_price?: number | null;
  is_active?: boolean;
}

export interface Agency {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataAgency[] | null;
}

export interface AgencyDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataAgencyDetail | null;
}

export interface AgencyManage {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataAgencyDetail[] | null;
}
