import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getDashboardStats } from '../services/dashboardServices';

export const useDashboardControllers = (userId: string | undefined) => {
  const fetchDashboardStats = useQuery({
    queryKey: ['dashboardStats', userId],
    queryFn: async () => unwrapApiResponse(await getDashboardStats(userId as string)),
    enabled: Boolean(userId),
  });

  return { fetchDashboardStats };
};
