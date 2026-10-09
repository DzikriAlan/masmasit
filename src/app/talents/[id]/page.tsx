import type { Metadata } from 'next';

import TalentBooking from '@/features/talents/components/TalentBooking';
import { getDetailMetadata, getFallbackMetadata, getPublicSupabase, isUuid } from '@/shared/lib/public-metadata';

// Rendered on first visit, then cached; OG tags refresh every 5 minutes.
export const revalidate = 300;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/talents/${params.id}`;
  const fallback = getFallbackMetadata(path, 'Talent', 'Book 1-on-1 sessions with Indonesian IT practitioners.');
  const supabase = getPublicSupabase();
  if (!supabase || !isUuid(params.id)) return fallback;

  try {
    // Public columns only — anon has no SELECT on the private ones (028).
    const { data } = await supabase
      .from('profiles')
      .select('full_name, bio, avatar_url, location')
      .eq('id', params.id)
      .maybeSingle();
    if (!data) return fallback;
    const name = data.full_name || 'Talent';
    return getDetailMetadata({
      path,
      title: `${name} — Book a session`,
      description: [data.location, data.bio].filter(Boolean).join(' · ') || `Book a 1-on-1 session with ${name}.`,
      image: data.avatar_url,
      type: 'profile',
    });
  } catch {
    return fallback;
  }
}

export default function TalentDetailPage() {
  return <TalentBooking />;
}
