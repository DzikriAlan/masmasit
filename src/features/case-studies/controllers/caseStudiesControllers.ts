import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { useCaseStudiesStates } from '../states/caseStudiesStates';
import { getCaseStudies } from '../services/caseStudiesServices';

export const useCaseStudiesControllers = () => {
  const { caseStudies, setCaseStudies } = useCaseStudiesStates();

  const fetchCaseStudies = useQuery({
    queryKey: ['caseStudies'],
    queryFn: async () => unwrapApiResponse(await getCaseStudies()) ?? [],
  });

  return { fetchCaseStudies, caseStudies, setCaseStudies };
};
