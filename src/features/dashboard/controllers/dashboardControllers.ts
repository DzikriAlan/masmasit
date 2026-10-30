import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getDashboardStats,
  getDashboardMonthlyActivity,
  getDashboardSkillDistribution,
  getDashboardApplicationStatus,
} from '../services/dashboardServices';

export const useDashboardControllers = (userId: string | undefined) => {
  const fetchDashboardStats = useQuery({
    queryKey: ['dashboardStats', userId],
    queryFn: async () => unwrapApiResponse(await getDashboardStats(userId as string)),
    enabled: Boolean(userId),
  });

  const fetchDashboardMonthlyActivity = useQuery({
    queryKey: ['dashboardMonthlyActivity', userId],
    queryFn: async () => unwrapApiResponse(await getDashboardMonthlyActivity(userId as string)),
    enabled: Boolean(userId),
  });

  const fetchDashboardSkillDistribution = useQuery({
    queryKey: ['dashboardSkillDistribution', userId],
    queryFn: async () => unwrapApiResponse(await getDashboardSkillDistribution(userId as string)),
    enabled: Boolean(userId),
  });

  const fetchDashboardApplicationStatus = useQuery({
    queryKey: ['dashboardApplicationStatus', userId],
    queryFn: async () => unwrapApiResponse(await getDashboardApplicationStatus(userId as string)),
    enabled: Boolean(userId),
  });

  return {
    fetchDashboardStats,
    fetchDashboardMonthlyActivity,
    fetchDashboardSkillDistribution,
    fetchDashboardApplicationStatus,
  };
};
