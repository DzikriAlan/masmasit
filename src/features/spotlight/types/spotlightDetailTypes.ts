export interface DataSpotlightDetail {
  id: string;
  user_id: string;
  agency_id: string | null;
  title: string;
  description: string;
  link_url: string | null;
  image_url: string | null;
  /** Added by migration 033; absent on databases where it is not applied yet. */
  image_urls?: string[] | null;
  source_type: 'build' | 'solo_builder' | 'agency';
  promoted_to_spotlight: boolean;
  likes_count: number;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  agencies?: { name: string; slug: string } | null;
}

export interface SpotlightDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataSpotlightDetail | null;
}
