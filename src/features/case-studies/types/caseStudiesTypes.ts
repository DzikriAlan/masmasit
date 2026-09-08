export interface DataCaseStudies {
  id: string;
  title: string;
  client_name: string;
  challenge: string;
  solution: string;
  result: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export interface CaseStudies {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataCaseStudies[] | null;
}
