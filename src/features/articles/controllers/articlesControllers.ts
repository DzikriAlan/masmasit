import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getArticles, getArticlesDetail } from '../services/articlesServices';

export const useArticlesControllers = () => {
  const fetchArticles = useQuery({
    queryKey: ['articles'],
    queryFn: async () => unwrapApiResponse(await getArticles()) ?? [],
  });

  return { fetchArticles };
};

export const useArticlesDetailControllers = (slug: string) => {
  const fetchArticlesDetail = useQuery({
    queryKey: ['articlesDetail', slug],
    queryFn: async () => unwrapApiResponse(await getArticlesDetail(slug)) ?? null,
    enabled: Boolean(slug),
  });

  return { fetchArticlesDetail };
};
