export interface DataBuilds {
  id: string;
  user_id: string;
  agency_id: string | null;
  title: string;
  description: string;
  link_url: string | null;
  image_url: string | null;
  source_type: 'build' | 'solo_builder' | 'agency';
  promoted_to_spotlight: boolean;
  likes_count: number;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface PayloadPostBuilds {
  user_id: string;
  title: string;
  description: string;
  link_url: string | null;
  promoted_to_spotlight: boolean;
}

export interface Builds {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataBuilds[] | null;
}
