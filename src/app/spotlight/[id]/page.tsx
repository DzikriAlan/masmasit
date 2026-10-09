import type { Metadata } from 'next';

import SpotlightDetail from '@/features/spotlight/components/SpotlightDetail';
import { getDetailMetadata, getFallbackMetadata, getPublicSupabase, isUuid } from '@/shared/lib/public-metadata';

// Rendered on first visit, then cached; OG tags refresh every 5 minutes.
export const revalidate = 300;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/spotlight/${params.id}`;
  const fallback = getFallbackMetadata(path, 'Spotlight', 'Products shipped by the MasmasIT community.');
  const supabase = getPublicSupabase();
  if (!supabase || !isUuid(params.id)) return fallback;

  try {
    // `*` keeps this working whether or not 033's image_urls column exists.
    const { data } = await supabase
      .from('builds')
      .select('*, profiles!builds_user_id_profiles_fkey(full_name), agencies(name)')
      .eq('id', params.id)
      .eq('promoted_to_spotlight', true)
      .maybeSingle();
    if (!data) return fallback;
    const row = data as {
      title: string;
      description: string;
      image_url: string | null;
      image_urls?: string[] | null;
      profiles?: { full_name: string | null } | null;
      agencies?: { name: string } | null;
    };
    const maker = row.agencies?.name ?? row.profiles?.full_name ?? null;
    return getDetailMetadata({
      path,
      title: maker ? `${row.title} — ${maker}` : row.title,
      description: row.description,
      image: row.image_urls?.[0] ?? row.image_url,
      type: 'article',
    });
  } catch {
    return fallback;
  }
}

export default function SpotlightDetailPage() {
  return <SpotlightDetail />;
}
