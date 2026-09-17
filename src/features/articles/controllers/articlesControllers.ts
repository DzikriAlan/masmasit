import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getArticles } from '../services/articlesServices';

export const useArticlesControllers = () => {
  const fetchArticles = useQuery({
    queryKey: ['articles'],
    queryFn: async () => unwrapApiResponse(await getArticles()) ?? [],
  });

  return { fetchArticles };
};
