export interface DataSpotlight {
  id: string;
  user_id: string;
  agency_id: string | null;
  title: string;
  description: string;
  link_url: string | null;
  source_type: 'build' | 'solo_builder' | 'agency';
  likes_count: number;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  agencies?: { name: string; slug: string } | null;
}

export interface PayloadPostSpotlight {
  user_id: string;
  title: string;
  description: string;
  link_url: string | null;
  source_type: 'solo_builder' | 'agency';
  agency_id: string | null;
}

export interface Spotlight {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataSpotlight[] | null;
}
