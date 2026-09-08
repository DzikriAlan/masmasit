import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { useSearchStates } from '../states/searchStates';
import { getSearch } from '../services/searchServices';

export const useSearchControllers = () => {
  const { payloadGetSearch, setGetSearch } = useSearchStates();

  const fetchSearch = useQuery({
    queryKey: ['search', payloadGetSearch.query],
    queryFn: async () => unwrapApiResponse(await getSearch(payloadGetSearch.query)) ?? [],
    enabled: payloadGetSearch.query.length >= 2,
  });

  return { fetchSearch, payloadGetSearch, setGetSearch };
};
