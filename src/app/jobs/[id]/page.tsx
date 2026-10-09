import type { Metadata } from 'next';

import JobDetail from '@/features/jobs/components/JobDetail';
import { getDetailMetadata, getFallbackMetadata, getPublicSupabase, isUuid } from '@/shared/lib/public-metadata';

// Rendered on first visit, then cached; OG tags refresh every 5 minutes.
export const revalidate = 300;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/jobs/${params.id}`;
  const fallback = getFallbackMetadata(path, 'Job opening', 'IT job openings on MasmasIT.');
  const supabase = getPublicSupabase();
  if (!supabase || !isUuid(params.id)) return fallback;

  try {
    const { data } = await supabase
      .from('jobs')
      .select('title, description, location, job_type, companies(name, logo_url)')
      .eq('id', params.id)
      .maybeSingle();
    if (!data) return fallback;
    const company = (Array.isArray(data.companies) ? data.companies[0] : data.companies) as
      | { name: string | null; logo_url: string | null }
      | null;
    const meta = [company?.name, data.location, data.job_type].filter(Boolean).join(' · ');
    return getDetailMetadata({
      path,
      title: company?.name ? `${data.title} — ${company.name}` : data.title,
      description: meta ? `${meta}. ${data.description}` : data.description,
      image: company?.logo_url,
    });
  } catch {
    return fallback;
  }
}

export default function JobDetailPage() {
  return <JobDetail />;
}
