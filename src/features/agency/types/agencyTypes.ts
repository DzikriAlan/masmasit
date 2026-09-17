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
  name: string;
  slug: string;
  logo_url: string | null;
  description: string;
  is_in_house: boolean;
  approval_status: string;
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
