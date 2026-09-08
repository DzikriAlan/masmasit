export interface PayloadGetSearch {
  query: string;
}

export interface DataSearch {
  id: string;
  type: 'profile' | 'job' | 'course' | 'project';
  title: string;
  subtitle: string;
  href: string;
}

export interface Search {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataSearch[] | null;
}
