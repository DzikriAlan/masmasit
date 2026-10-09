import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataArticles } from '../types/articlesTypes';

// Discover's "Article" strand (REST.md Bagian 3/9) — platform-authored,
// admin-published (see AdminCatalog.tsx for the write side).
export const getArticles = async () => {
  return toApiResponse<DataArticles[]>(
    supabase
      .from('articles')
      .select('id, slug, title, excerpt, body, cover_image_url, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    'Articles retrieved successfully'
  );
};

export const getArticlesDetail = async (slug: string) => {
  return toApiResponse<DataArticles | null>(
    supabase
      .from('articles')
      .select('id, slug, title, excerpt, body, cover_image_url, created_at')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle(),
    'Article retrieved successfully'
  );
};
