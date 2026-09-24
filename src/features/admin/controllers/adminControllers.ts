import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteAdminAgencyService,
  deleteAdminArticle,
  deleteAdminCaseStudy,
  deleteAdminContent,
  deleteAdminUserRole,
  getAdminAgencyServices,
  getAdminApprovals,
  getAdminArticles,
  getAdminAuditLogs,
  getAdminUserActivity,
  getAdminOnboarding,
  getAdminCaseStudies,
  getAdminTeamCollabs,
  getAdminRoleDistribution,
  getAdminRegions,
  getAdminUsers,
  postAdminAgencyService,
  postAdminArticle,
  postAdminCaseStudy,
  postAdminUserRole,
  updateAdminAgencyApproval,
  updateAdminAgencyService,
  updateAdminArticle,
  updateAdminCaseStudy,
  updateAdminEventApproval,
  updateAdminTeamCollabsMatch,
  getAdminAgencyProjects,
  getAdminAnalytics,
  getAdminCoaches,
  getAdminCompanies,
  getAdminModeration,
  getAdminPayments,
  getAdminSettings,
  getAdminStats,
  updateAdminAgencyStatus,
  updateAdminCompanyApproval,
  updateAdminPaymentPaid,
  updateAdminPaymentReset,
  updateAdminSettings,
  updateAdminUserApproval,
} from '../services/adminServices';
import type { PayloadPatchAdminSettings, PayloadPostAdminRole } from '../types/adminTypes';

export const useAdminControllers = (userId: string | undefined, enabled: boolean) => {
  const queryClient = useQueryClient();

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
  };

  const fetchAdminCompanies = useQuery({
    queryKey: ['adminCompanies'],
    queryFn: async () => unwrapApiResponse(await getAdminCompanies()) ?? [],
    enabled,
  });

  const fetchAdminCoaches = useQuery({
    queryKey: ['adminCoaches'],
    queryFn: async () => unwrapApiResponse(await getAdminCoaches()) ?? [],
    enabled,
  });

  const fetchAdminSettings = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => unwrapApiResponse(await getAdminSettings()) ?? null,
    enabled,
  });

  const fetchAdminStats = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => unwrapApiResponse(await getAdminStats()),
    enabled,
  });

  const fetchAdminAgencyProjects = useQuery({
    queryKey: ['adminAgencyProjects'],
    queryFn: async () => unwrapApiResponse(await getAdminAgencyProjects()) ?? [],
    enabled,
  });

  const fetchAdminModeration = useQuery({
    queryKey: ['adminModeration'],
    queryFn: async () => unwrapApiResponse(await getAdminModeration()) ?? [],
    enabled,
  });

  const fetchAdminPayments = useQuery({
    queryKey: ['adminPayments'],
    queryFn: async () => unwrapApiResponse(await getAdminPayments()) ?? [],
    enabled,
  });

  const fetchAdminAnalytics = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => unwrapApiResponse(await getAdminAnalytics()),
    enabled,
  });

  const changeAdminCompanyApproval = useMutation({
    mutationFn: async (payload: { id: string; status: string }) =>
      unwrapApiResponse(await updateAdminCompanyApproval(payload.id, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
    },
  });

  const changeAdminUserApproval = useMutation({
    mutationFn: async (payload: {
      id: string;
      field: 'coach_approved' | 'talent_approved';
      status: string;
    }) => unwrapApiResponse(await updateAdminUserApproval(payload.id, payload.field, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoaches'] });
    },
  });

  const changeAdminSettings = useMutation({
    mutationFn: async (payload: { id: string; settings: PayloadPatchAdminSettings }) =>
      unwrapApiResponse(await updateAdminSettings(payload.id, payload.settings)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
  });

  const changeAdminAgencyStatus = useMutation({
    mutationFn: async (payload: { id: string; status: string }) =>
      unwrapApiResponse(await updateAdminAgencyStatus(payload.id, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAgencyProjects'] });
    },
  });

  const changeAdminPaymentPaid = useMutation({
    mutationFn: async (payload: { table: string; id: string; subField?: string }) =>
      unwrapApiResponse(await updateAdminPaymentPaid(payload.table, payload.id, userId, payload.subField)),
    onSuccess: invalidatePayments,
  });

  const changeAdminPaymentReset = useMutation({
    mutationFn: async (payload: { table: string; id: string; subField?: string }) =>
      unwrapApiResponse(await updateAdminPaymentReset(payload.table, payload.id, payload.subField)),
    onSuccess: invalidatePayments,
  });

  const removeAdminContent = useMutation({
    mutationFn: async (payload: { table: string; id: string }) =>
      unwrapApiResponse(await deleteAdminContent(payload.table, payload.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminModeration'] });
    },
  });

  const fetchAdminApprovals = useQuery({
    queryKey: ['adminApprovals'],
    queryFn: async () => unwrapApiResponse(await getAdminApprovals()),
    enabled,
  });

  const fetchAdminRoleDistribution = useQuery({
    queryKey: ['adminRoleDistribution'],
    queryFn: async () => unwrapApiResponse(await getAdminRoleDistribution()) ?? [],
    enabled,
  });

  const changeAdminEventApproval = useMutation({
    mutationFn: async (payload: { id: string; status: string }) =>
      unwrapApiResponse(await updateAdminEventApproval(payload.id, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // Agency approval (REST.md Bagian 7) — same shape as company/event approval.
  const changeAdminAgencyApproval = useMutation({
    mutationFn: async (payload: { id: string; status: string }) =>
      unwrapApiResponse(await updateAdminAgencyApproval(payload.id, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['agency'] });
    },
  });

  const fetchAdminTeamCollabs = useQuery({
    queryKey: ['adminTeamCollabs'],
    queryFn: async () => unwrapApiResponse(await getAdminTeamCollabs()) ?? [],
    enabled,
  });

  // Marks a Team Collabs listing Matched (REST.md Bagian 6.2) — the one
  // field a client-side self-update can never move, see migration 015's
  // guard_team_collabs_match trigger.
  const changeAdminTeamCollabsMatch = useMutation({
    mutationFn: async (payload: { id: string; matchedWith: string }) =>
      unwrapApiResponse(await updateAdminTeamCollabsMatch(payload.id, payload.matchedWith)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTeamCollabs'] });
      queryClient.invalidateQueries({ queryKey: ['teamCollabs'] });
    },
  });

  return {
    fetchAdminApprovals,
    fetchAdminRoleDistribution,
    changeAdminEventApproval,
    changeAdminAgencyApproval,
    fetchAdminTeamCollabs,
    changeAdminTeamCollabsMatch,
    fetchAdminCompanies,
    fetchAdminCoaches,
    fetchAdminSettings,
    fetchAdminStats,
    fetchAdminAgencyProjects,
    fetchAdminModeration,
    fetchAdminPayments,
    fetchAdminAnalytics,
    changeAdminCompanyApproval,
    changeAdminUserApproval,
    changeAdminSettings,
    changeAdminAgencyStatus,
    changeAdminPaymentPaid,
    changeAdminPaymentReset,
    removeAdminContent,
  };
};

/** Role management — super_admin only; the API enforces that too. */
export const useAdminRolesControllers = (search: string, enabled: boolean) => {
  const queryClient = useQueryClient();

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    queryClient.invalidateQueries({ queryKey: ['adminRoleDistribution'] });
    queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
  };

  const fetchAdminRegions = useQuery({
    queryKey: ['adminRegions'],
    queryFn: async () => unwrapApiResponse(await getAdminRegions()) ?? [],
    enabled,
  });

  const fetchAdminUsers = useQuery({
    queryKey: ['adminUsers', search],
    queryFn: async () => unwrapApiResponse(await getAdminUsers(search)) ?? [],
    enabled,
  });

  const storeAdminUserRole = useMutation({
    mutationFn: async (payload: PayloadPostAdminRole) =>
      unwrapApiResponse(await postAdminUserRole(payload)),
    onSuccess: invalidateUsers,
  });

  const removeAdminUserRole = useMutation({
    mutationFn: async (payload: { userId: string; role: string }) =>
      unwrapApiResponse(await deleteAdminUserRole(payload.userId, payload.role)),
    onSuccess: invalidateUsers,
  });

  return { fetchAdminUsers, fetchAdminRegions, storeAdminUserRole, removeAdminUserRole };
};

/** Audit trail of admin actions. */
export const useAdminAuditControllers = (enabled: boolean) => {
  const fetchAdminAuditLogs = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => unwrapApiResponse(await getAdminAuditLogs()) ?? [],
    enabled,
  });

  return { fetchAdminAuditLogs };
};

/** Per-member feature usage, for the User Activity tab. */
export const useAdminUserActivityControllers = (enabled: boolean) => {
  const fetchAdminUserActivity = useQuery({
    queryKey: ['adminUserActivity'],
    queryFn: async () => unwrapApiResponse(await getAdminUserActivity()) ?? [],
    enabled,
  });

  return { fetchAdminUserActivity };
};

export const useAdminOnboardingControllers = (enabled: boolean) => {
  const fetchAdminOnboarding = useQuery({
    queryKey: ['adminOnboarding'],
    queryFn: async () => unwrapApiResponse(await getAdminOnboarding()) ?? [],
    enabled,
  });

  return { fetchAdminOnboarding };
};

/** Catalogue CRUD: agency services and case studies. */
export const useAdminCatalogControllers = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const invalidateServices = () => {
    queryClient.invalidateQueries({ queryKey: ['adminAgencyServices'] });
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  const invalidateCaseStudies = () => {
    queryClient.invalidateQueries({ queryKey: ['adminCaseStudies'] });
    queryClient.invalidateQueries({ queryKey: ['caseStudies'] });
  };

  const fetchAdminAgencyServices = useQuery({
    queryKey: ['adminAgencyServices'],
    queryFn: async () => unwrapApiResponse(await getAdminAgencyServices()) ?? [],
    enabled,
  });

  const storeAdminAgencyService = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrapApiResponse(await postAdminAgencyService(payload)),
    onSuccess: invalidateServices,
  });

  const changeAdminAgencyService = useMutation({
    mutationFn: async (payload: { id: string; data: Record<string, unknown> }) =>
      unwrapApiResponse(await updateAdminAgencyService(payload.id, payload.data)),
    onSuccess: invalidateServices,
  });

  const removeAdminAgencyService = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await deleteAdminAgencyService(id)),
    onSuccess: invalidateServices,
  });

  const fetchAdminCaseStudies = useQuery({
    queryKey: ['adminCaseStudies'],
    queryFn: async () => unwrapApiResponse(await getAdminCaseStudies()) ?? [],
    enabled,
  });

  const storeAdminCaseStudy = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrapApiResponse(await postAdminCaseStudy(payload)),
    onSuccess: invalidateCaseStudies,
  });

  const changeAdminCaseStudy = useMutation({
    mutationFn: async (payload: { id: string; data: Record<string, unknown> }) =>
      unwrapApiResponse(await updateAdminCaseStudy(payload.id, payload.data)),
    onSuccess: invalidateCaseStudies,
  });

  const removeAdminCaseStudy = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await deleteAdminCaseStudy(id)),
    onSuccess: invalidateCaseStudies,
  });

  // Articles — Discover's "Article" strand (Bagian 3/9).
  const invalidateArticles = () => {
    queryClient.invalidateQueries({ queryKey: ['adminArticles'] });
    queryClient.invalidateQueries({ queryKey: ['articles'] });
  };

  const fetchAdminArticles = useQuery({
    queryKey: ['adminArticles'],
    queryFn: async () => unwrapApiResponse(await getAdminArticles()) ?? [],
    enabled,
  });

  const storeAdminArticle = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => unwrapApiResponse(await postAdminArticle(payload)),
    onSuccess: invalidateArticles,
  });

  const changeAdminArticle = useMutation({
    mutationFn: async (payload: { id: string; data: Record<string, unknown> }) =>
      unwrapApiResponse(await updateAdminArticle(payload.id, payload.data)),
    onSuccess: invalidateArticles,
  });

  const removeAdminArticle = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await deleteAdminArticle(id)),
    onSuccess: invalidateArticles,
  });

  return {
    fetchAdminAgencyServices,
    storeAdminAgencyService,
    changeAdminAgencyService,
    removeAdminAgencyService,
    fetchAdminCaseStudies,
    storeAdminCaseStudy,
    changeAdminCaseStudy,
    removeAdminCaseStudy,
    fetchAdminArticles,
    storeAdminArticle,
    changeAdminArticle,
    removeAdminArticle,
  };
};
