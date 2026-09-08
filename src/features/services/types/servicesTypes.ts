export interface PayloadPostServicesRequest {
  client_name: string;
  client_email: string;
  client_company: string | null;
  service_id: string | null;
  scope: string;
  budget: number | null;
}

export interface DataServices {
  id: string;
  category: string;
  title: string;
  description: string;
  base_price: number | null;
  is_active: boolean;
}

export interface Services {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataServices[] | null;
}
