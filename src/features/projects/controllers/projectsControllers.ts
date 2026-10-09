import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { useProjectsStates } from '../states/projectsStates';
import {
  getProjects,
  getProjectsBids,
  getProjectsDetail,
  getProjectsReviews,
  postProjects,
  postProjectsReview,
  updateProjectsBidCancelled,
  postProjectsBid,
  postProjectsBidAccepted,
  updateProjectsStatus,
} from '../services/projectsServices';
import type { PayloadPostProjects, PayloadPostProjectsBid, PayloadPostProjectsReview } from '../types/projectsTypes';

export const useProjectsControllers = () => {
  const queryClient = useQueryClient();
  const { payloadGetProjects, setGetProjects } = useProjectsStates();

  const fetchProjects = useQuery({
    queryKey: ['projects', payloadGetProjects],
    queryFn: async () => unwrapApiResponse(await getProjects(payloadGetProjects)) ?? [],
  });

  const storeProjects = useMutation({
    mutationFn: async (payload: PayloadPostProjects) => unwrapApiResponse(await postProjects(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return { fetchProjects, storeProjects, payloadGetProjects, setGetProjects };
};

export const useProjectsDetailControllers = (projectId: string) => {
  const queryClient = useQueryClient();

  const fetchProjectsDetail = useQuery({
    queryKey: ['projectsDetail', projectId],
    queryFn: async () => unwrapApiResponse(await getProjectsDetail(projectId)) ?? null,
    enabled: Boolean(projectId),
  });

  const fetchProjectsBids = useQuery({
    queryKey: ['projectsBids', projectId],
    queryFn: async () => unwrapApiResponse(await getProjectsBids(projectId)) ?? [],
    enabled: Boolean(projectId),
  });

  const storeProjectsBid = useMutation({
    mutationFn: async (payload: PayloadPostProjectsBid) =>
      unwrapApiResponse(await postProjectsBid(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectsBids', projectId] });
    },
  });

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: ['projectsBids', projectId] });
    queryClient.invalidateQueries({ queryKey: ['projectsDetail', projectId] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const storeProjectsBidAccepted = useMutation({
    mutationFn: async (bidId: string) => unwrapApiResponse(await postProjectsBidAccepted(bidId, projectId)),
    onSuccess: invalidateProject,
  });

  const changeProjectsStatus = useMutation({
    mutationFn: async (status: string) => unwrapApiResponse(await updateProjectsStatus(projectId, status)),
    onSuccess: invalidateProject,
  });

  const modifyProjectsBidCancelled = useMutation({
    mutationFn: async (bidId: string) => unwrapApiResponse(await updateProjectsBidCancelled(bidId)),
    onSuccess: () => {
      invalidateProject();
      queryClient.invalidateQueries({ queryKey: ['activityProjects'] });
    },
  });

  const fetchProjectsReviews = useQuery({
    queryKey: ['projectsReviews', projectId],
    queryFn: async () => unwrapApiResponse(await getProjectsReviews(projectId)) ?? [],
    enabled: Boolean(projectId),
  });

  const storeProjectsReview = useMutation({
    mutationFn: async (payload: PayloadPostProjectsReview) => unwrapApiResponse(await postProjectsReview(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectsReviews', projectId] });
      queryClient.invalidateQueries({ queryKey: ['memberReviews'] });
    },
  });

  return {
    fetchProjectsDetail,
    fetchProjectsBids,
    fetchProjectsReviews,
    storeProjectsBid,
    storeProjectsBidAccepted,
    storeProjectsReview,
    changeProjectsStatus,
    modifyProjectsBidCancelled,
  };
};
