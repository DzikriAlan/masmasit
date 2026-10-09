import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteAdminAgency,
  deleteAdminAgencyService,
  deleteAdminArticle,
  deleteAdminCaseStudy,
  deleteAdminModeration,
  deleteAdminUserRole,
  getAdminAgencies,
  getAdminApplications,
  getAdminMembers,
  patchAdminAgency,
  patchAdminCompanyApproval,
  patchAdminMemberSuspension,
  patchAdminModeration,
  patchAdminPayment,
  patchAdminPersonApproval,
  patchAdminTeamCollabsClose,
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
  getAdminModeration,
  getAdminPayments,
  getAdminSettings,
  getAdminStats,
  updateAdminAgencyStatus,
  updateAdminSettings,
} from '../services/adminServices';
import type {
  AdminModerationType,
  DataAdminPage,
  DataAdminPayments,
  PayloadGetAdminList,
  PayloadGetAdminMembers,
  PayloadGetAdminModeration,
  PayloadPatchAdminAgency,
  PayloadPatchAdminMemberSuspension,
  PayloadPatchAdminSettings,
  PayloadPostAdminRole,
} from '../types/adminTypes';
import type { ApiResponse } from '@/shared/lib/apiResponse';

/** Keeps the envelope's pagination next to the rows for paged admin lists. */
const unwrapAdminPage = <T>(response: ApiResponse<T[]>, fallbackLimit: number): DataAdminPage<T> => {
  const items = unwrapApiResponse(response) ?? [];
  return {
    items,
    pagination: response.pagination ?? { page: 1, limit: fallbackLimit, total: items.length, totalPages: 1 },
  };
};

export const useAdminControllers = (enabled: boolean, includeAllApprovals = false) => {
  const queryClient = useQueryClient();

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
  };

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

  const invalidateApprovals = () => {
    queryClient.invalidateQueries({ queryKey: ['adminApprovals'] });
    queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
  };

  const changeAdminCompanyApproval = useMutation({
    mutationFn: async (payload: { id: string; status: string }) =>
      unwrapApiResponse(await patchAdminCompanyApproval(payload.id, payload.status)),
    onSuccess: invalidateApprovals,
  });

  const changeAdminUserApproval = useMutation({
    mutationFn: async (payload: {
      id: string;
      field: 'coach_approved' | 'talent_approved';
      status: string;
    }) => unwrapApiResponse(await patchAdminPersonApproval(payload.id, payload.field, payload.status)),
    onSuccess: invalidateApprovals,
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
    mutationFn: async (payload: { table: DataAdminPayments['table']; id: string; subField?: string }) =>
      unwrapApiResponse(await patchAdminPayment(payload.table, payload.id, 'paid', payload.subField)),
    onSuccess: invalidatePayments,
  });

  const changeAdminPaymentReset = useMutation({
    mutationFn: async (payload: { table: DataAdminPayments['table']; id: string; subField?: string }) =>
      unwrapApiResponse(await patchAdminPayment(payload.table, payload.id, 'reset', payload.subField)),
    onSuccess: invalidatePayments,
  });

  const fetchAdminApprovals = useQuery({
    queryKey: ['adminApprovals', includeAllApprovals],
    queryFn: async () => unwrapApiResponse(await getAdminApprovals(includeAllApprovals)),
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

  // TC-14-07: take a Team Collabs listing off the board.
  const changeAdminTeamCollabsClose = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await patchAdminTeamCollabsClose(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTeamCollabs'] });
      queryClient.invalidateQueries({ queryKey: ['teamCollabs'] });
    },
  });

  return {
    changeAdminTeamCollabsClose,
    fetchAdminApprovals,
    fetchAdminRoleDistribution,
    changeAdminEventApproval,
    changeAdminAgencyApproval,
    fetchAdminTeamCollabs,
    changeAdminTeamCollabsMatch,
    fetchAdminSettings,
    fetchAdminStats,
    fetchAdminAgencyProjects,
    fetchAdminPayments,
    fetchAdminAnalytics,
    changeAdminCompanyApproval,
    changeAdminUserApproval,
    changeAdminSettings,
    changeAdminAgencyStatus,
    changeAdminPaymentPaid,
    changeAdminPaymentReset,
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

/** Moderation tab (TC-14-06): one content type at a time, searched + paged on the server. */
export const useAdminModerationControllers = (payload: PayloadGetAdminModeration, enabled: boolean) => {
  const queryClient = useQueryClient();
  const limit = payload.limit ?? 20;

  const invalidateModeration = (type: AdminModerationType) => {
    queryClient.invalidateQueries({ queryKey: ['adminModeration'] });
    queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
    if (type === 'discussions' || type === 'replies') queryClient.invalidateQueries({ queryKey: ['discussions'] });
    if (type === 'builds' || type === 'spotlight') {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
      queryClient.invalidateQueries({ queryKey: ['spotlight'] });
    }
  };

  const fetchAdminModeration = useQuery({
    queryKey: ['adminModeration', payload],
    queryFn: async () => unwrapAdminPage(await getAdminModeration({ ...payload, limit }), limit),
    enabled,
  });

  const removeAdminModeration = useMutation({
    mutationFn: async (target: { type: AdminModerationType; id: string }) =>
      unwrapApiResponse(await deleteAdminModeration(target.type, target.id)),
    onSuccess: (_data, target) => invalidateModeration(target.type),
  });

  const changeAdminModeration = useMutation({
    mutationFn: async (target: {
      type: AdminModerationType;
      id: string;
      data: { is_featured?: boolean; promoted_to_spotlight?: boolean };
    }) => unwrapApiResponse(await patchAdminModeration(target.type, target.id, target.data)),
    onSuccess: (_data, target) => invalidateModeration(target.type),
  });

  return { fetchAdminModeration, removeAdminModeration, changeAdminModeration };
};

/** Applications tab (TC-00-11). */
export const useAdminApplicationsControllers = (payload: PayloadGetAdminList, enabled: boolean) => {
  const limit = payload.limit ?? 20;

  const fetchAdminApplications = useQuery({
    queryKey: ['adminApplications', payload],
    queryFn: async () => unwrapAdminPage(await getAdminApplications({ ...payload, limit }), limit),
    enabled,
  });

  return { fetchAdminApplications };
};

/** Members tab: list + suspend / restore (TC-09-16). */
export const useAdminMembersControllers = (payload: PayloadGetAdminMembers, enabled: boolean) => {
  const queryClient = useQueryClient();
  const limit = payload.limit ?? 20;

  const fetchAdminMembers = useQuery({
    queryKey: ['adminMembers', payload],
    queryFn: async () => unwrapAdminPage(await getAdminMembers({ ...payload, limit }), limit),
    enabled,
  });

  const changeAdminMemberSuspension = useMutation({
    mutationFn: async (target: { id: string; data: PayloadPatchAdminMemberSuspension }) =>
      unwrapApiResponse(await patchAdminMemberSuspension(target.id, target.data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['directory'] });
    },
  });

  return { fetchAdminMembers, changeAdminMemberSuspension };
};

/** Agencies: edit / delete (TC-14-07). */
export const useAdminAgenciesControllers = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const invalidateAgencies = () => {
    queryClient.invalidateQueries({ queryKey: ['adminAgencies'] });
    queryClient.invalidateQueries({ queryKey: ['adminApprovals'] });
    queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
    queryClient.invalidateQueries({ queryKey: ['agency'] });
  };

  const fetchAdminAgencies = useQuery({
    queryKey: ['adminAgencies'],
    queryFn: async () => unwrapApiResponse(await getAdminAgencies()) ?? [],
    enabled,
  });

  const changeAdminAgency = useMutation({
    mutationFn: async (target: { id: string; data: PayloadPatchAdminAgency }) =>
      unwrapApiResponse(await patchAdminAgency(target.id, target.data)),
    onSuccess: invalidateAgencies,
  });

  const removeAdminAgency = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await deleteAdminAgency(id)),
    onSuccess: invalidateAgencies,
  });

  return { fetchAdminAgencies, changeAdminAgency, removeAdminAgency };
};
