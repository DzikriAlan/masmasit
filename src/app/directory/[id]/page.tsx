import type { Metadata } from 'next';

import DirectoryDetail from '@/features/directory/components/DirectoryDetail';
import { getDetailMetadata, getFallbackMetadata, getPublicSupabase, isUuid } from '@/shared/lib/public-metadata';

// Rendered on first visit, then cached; OG tags refresh every 5 minutes.
export const revalidate = 300;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/directory/${params.id}`;
  const fallback = getFallbackMetadata(path, 'Member', 'IT practitioners across Indonesia on MasmasIT.');
  const supabase = getPublicSupabase();
  if (!supabase || !isUuid(params.id)) return fallback;

  try {
    // Public columns only — anon has no SELECT on the private ones (028).
    const { data } = await supabase
      .from('profiles')
      .select('full_name, bio, avatar_url, location')
      .eq('id', params.id)
      .eq('is_suspended', false)
      .maybeSingle();
    if (!data) return fallback;
    const name = data.full_name || 'Member';
    return getDetailMetadata({
      path,
      title: name,
      description: [data.location, data.bio].filter(Boolean).join(' · ') || `${name} is an IT practitioner on MasmasIT.`,
      image: data.avatar_url,
      type: 'profile',
    });
  } catch {
    return fallback;
  }
}

export default function DirectoryDetailPage() {
  return <DirectoryDetail />;
}
