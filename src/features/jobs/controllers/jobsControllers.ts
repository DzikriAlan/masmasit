import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { useJobsStates } from '../states/jobsStates';
import {
  getJobs,
  getJobsApplicants,
  getJobsMyApplications,
  getJobsOwned,
  updateJobsApplicationStatus,
  updateJobsStatus,
  getJobsApplication,
  getJobsCompany,
  getJobsDetail,
  getJobsUserSkills,
  postJobsApplication,
  postJobsCompany,
  postJobsPosting,
  postJobsUserRole,
} from '../services/jobsServices';
import type {
  PayloadPostJobsApplication,
  PayloadPostJobsCompany,
  PayloadPostJobsPosting,
  PayloadPostJobsUserRole,
} from '../types/jobsTypes';

export const useJobsControllers = (userId: string | undefined) => {
  const { payloadGetJobs, setGetJobs } = useJobsStates();

  const fetchJobs = useQuery({
    queryKey: ['jobs', payloadGetJobs],
    queryFn: async () => unwrapApiResponse(await getJobs(payloadGetJobs)) ?? [],
  });

  const fetchJobsUserSkills = useQuery({
    queryKey: ['jobsUserSkills', userId],
    queryFn: async () => unwrapApiResponse(await getJobsUserSkills(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  return { fetchJobs, fetchJobsUserSkills, payloadGetJobs, setGetJobs };
};

export const useJobsDetailControllers = (jobId: string, userId: string | undefined) => {
  const queryClient = useQueryClient();

  const fetchJobsDetail = useQuery({
    queryKey: ['jobsDetail', jobId],
    queryFn: async () => unwrapApiResponse(await getJobsDetail(jobId)) ?? null,
    enabled: Boolean(jobId),
  });

  const fetchJobsApplication = useQuery({
    queryKey: ['jobsApplication', jobId, userId],
    queryFn: async () => unwrapApiResponse(await getJobsApplication(jobId, userId as string)) ?? null,
    enabled: Boolean(jobId && userId),
  });

  const storeJobsApplication = useMutation({
    mutationFn: async (payload: PayloadPostJobsApplication) =>
      unwrapApiResponse(await postJobsApplication(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsApplication'] });
    },
  });

  return { fetchJobsDetail, fetchJobsApplication, storeJobsApplication };
};

export const usePostJobControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const fetchJobsCompany = useQuery({
    queryKey: ['jobsCompany', userId],
    queryFn: async () => unwrapApiResponse(await getJobsCompany(userId as string)) ?? null,
    enabled: Boolean(userId),
  });

  const storeJobsCompany = useMutation({
    mutationFn: async (payload: PayloadPostJobsCompany) =>
      unwrapApiResponse(await postJobsCompany(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsCompany'] });
    },
  });

  const storeJobsUserRole = useMutation({
    mutationFn: async (payload: PayloadPostJobsUserRole) =>
      unwrapApiResponse(await postJobsUserRole(payload)),
  });

  const storeJobsPosting = useMutation({
    mutationFn: async (payload: PayloadPostJobsPosting) =>
      unwrapApiResponse(await postJobsPosting(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return { fetchJobsCompany, storeJobsCompany, storeJobsUserRole, storeJobsPosting };
};

/** Employer view: their postings, the applicants on each, and status changes. */
export const useJobsEmployerControllers = (companyId: string | undefined, jobId: string | null) => {
  const queryClient = useQueryClient();

  const fetchJobsOwned = useQuery({
    queryKey: ['jobsOwned', companyId],
    queryFn: async () => unwrapApiResponse(await getJobsOwned(companyId as string)) ?? [],
    enabled: Boolean(companyId),
  });

  const fetchJobsApplicants = useQuery({
    queryKey: ['jobsApplicants', jobId],
    queryFn: async () => unwrapApiResponse(await getJobsApplicants(jobId as string)) ?? [],
    enabled: Boolean(jobId),
  });

  const changeJobsApplicationStatus = useMutation({
    mutationFn: async (payload: { applicationId: string; status: string }) =>
      unwrapApiResponse(await updateJobsApplicationStatus(payload.applicationId, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsApplicants'] });
      queryClient.invalidateQueries({ queryKey: ['jobsMyApplications'] });
    },
  });

  const changeJobsStatus = useMutation({
    mutationFn: async (payload: { jobId: string; status: string }) =>
      unwrapApiResponse(await updateJobsStatus(payload.jobId, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsOwned'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return { fetchJobsOwned, fetchJobsApplicants, changeJobsApplicationStatus, changeJobsStatus };
};

/** Applicant view: the jobs this member applied to and where each stands. */
export const useJobsMyApplicationsControllers = (userId: string | undefined) => {
  const fetchJobsMyApplications = useQuery({
    queryKey: ['jobsMyApplications', userId],
    queryFn: async () => unwrapApiResponse(await getJobsMyApplications(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  return { fetchJobsMyApplications };
};
