import type { Metadata } from 'next';

import ProjectDetail from '@/features/projects/components/ProjectDetail';
import { getDetailMetadata, getFallbackMetadata, getPublicSupabase, isUuid } from '@/shared/lib/public-metadata';

// Rendered on first visit, then cached; OG tags refresh every 5 minutes.
export const revalidate = 300;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/projects/${params.id}`;
  const fallback = getFallbackMetadata(path, 'Project', 'Freelance IT projects on MasmasIT.');
  const supabase = getPublicSupabase();
  if (!supabase || !isUuid(params.id)) return fallback;

  try {
    const { data } = await supabase
      .from('projects')
      .select('title, description, budget_min, budget_max')
      .eq('id', params.id)
      .maybeSingle();
    if (!data) return fallback;
    const getBudget = () => {
      if (data.budget_min && data.budget_max) return `Rp ${data.budget_min.toLocaleString('id-ID')} – ${data.budget_max.toLocaleString('id-ID')}`;
      if (data.budget_max) return `Up to Rp ${data.budget_max.toLocaleString('id-ID')}`;
      if (data.budget_min) return `From Rp ${data.budget_min.toLocaleString('id-ID')}`;
      return '';
    };
    const budget = getBudget();
    return getDetailMetadata({
      path,
      title: data.title,
      description: budget ? `${budget}. ${data.description}` : data.description,
    });
  } catch {
    return fallback;
  }
}

export default function ProjectDetailPage() {
  return <ProjectDetail />;
}
