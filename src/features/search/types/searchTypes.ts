export interface PayloadGetSearch {
  query: string;
}

export interface DataSearch {
  id: string;
  type: 'profile' | 'talent' | 'job' | 'course' | 'project' | 'agency' | 'service' | 'event' | 'discussion' | 'build';
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
