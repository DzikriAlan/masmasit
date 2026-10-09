import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

import ArticlesDetail from '@/features/articles/components/ArticlesDetail';

interface Props {
  params: { slug: string };
}

// Metadata is read server-side as a guest, which works because migration 033
// grants anon SELECT on published articles. The page body itself is fetched
// client-side through the articles controller like every other detail page.
const getArticleMeta = async (slug: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await client
      .from('articles')
      .select('title, excerpt, cover_image_url, created_at')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleMeta(params.slug);
  if (!article) return { title: 'Article — MasmasIT' };

  return {
    title: `${article.title} — MasmasIT`,
    description: article.excerpt,
    alternates: { canonical: `/articles/${params.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      publishedTime: article.created_at,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

export default function ArticlePage({ params }: Props) {
  return <ArticlesDetail slug={params.slug} />;
}
