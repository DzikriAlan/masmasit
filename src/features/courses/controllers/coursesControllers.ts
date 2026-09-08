import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getCourses,
  getCoursesMine,
  getCoursesModuleCompletions,
  getCoursesQuizSubmissions,
  postCoursesModuleCompletion,
  postCoursesQuizSubmission,
  getCoursesCertificate,
  getCoursesDetail,
  getCoursesEnrollment,
  getCoursesModules,
  getCoursesSettings,
  postCoursesCertificate,
  postCoursesEnrollment,
  updateCoursesEnrollmentProgress,
} from '../services/coursesServices';
import type {
  PayloadPostCoursesCertificate,
  PayloadPostCoursesEnrollment,
  PayloadPostCoursesModuleCompletion,
  PayloadPostCoursesQuizSubmission,
} from '../types/coursesTypes';

export const useCoursesControllers = (userId?: string) => {
  const fetchCourses = useQuery({
    queryKey: ['courses'],
    queryFn: async () => unwrapApiResponse(await getCourses()) ?? [],
  });

  const fetchCoursesMine = useQuery({
    queryKey: ['coursesMine', userId],
    queryFn: async () => unwrapApiResponse(await getCoursesMine(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  return { fetchCourses, fetchCoursesMine };
};

export const useCoursesDetailControllers = (courseId: string, userId: string | undefined) => {
  const queryClient = useQueryClient();

  const fetchCoursesDetail = useQuery({
    queryKey: ['coursesDetail', courseId],
    queryFn: async () => unwrapApiResponse(await getCoursesDetail(courseId)) ?? null,
    enabled: Boolean(courseId),
  });

  const fetchCoursesModules = useQuery({
    queryKey: ['coursesModules', courseId],
    queryFn: async () => unwrapApiResponse(await getCoursesModules(courseId)) ?? [],
    enabled: Boolean(courseId),
  });

  const fetchCoursesEnrollment = useQuery({
    queryKey: ['coursesEnrollment', courseId, userId],
    queryFn: async () => unwrapApiResponse(await getCoursesEnrollment(courseId, userId as string)) ?? null,
    enabled: Boolean(courseId && userId),
  });

  const fetchCoursesCertificate = useQuery({
    queryKey: ['coursesCertificate', courseId, userId],
    queryFn: async () => unwrapApiResponse(await getCoursesCertificate(courseId, userId as string)) ?? null,
    enabled: Boolean(courseId && userId),
  });

  const fetchCoursesSettings = useQuery({
    queryKey: ['coursesSettings'],
    queryFn: async () => unwrapApiResponse(await getCoursesSettings())?.lynkid_courses_url ?? null,
  });

  const storeCoursesEnrollment = useMutation({
    mutationFn: async (payload: PayloadPostCoursesEnrollment) =>
      unwrapApiResponse(await postCoursesEnrollment(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coursesEnrollment', courseId] });
    },
  });

  const changeCoursesEnrollmentProgress = useMutation({
    mutationFn: async (payload: { enrollmentId: string; progress: number }) =>
      unwrapApiResponse(await updateCoursesEnrollmentProgress(payload.enrollmentId, payload.progress)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coursesEnrollment', courseId] });
    },
  });

  // Completions hang off the enrollment, so this query waits for it to resolve.
  const enrollmentId = fetchCoursesEnrollment.data?.id ?? null;

  const fetchCoursesModuleCompletions = useQuery({
    queryKey: ['coursesModuleCompletions', enrollmentId],
    queryFn: async () => unwrapApiResponse(await getCoursesModuleCompletions(enrollmentId as string)) ?? [],
    enabled: Boolean(enrollmentId),
  });

  const fetchCoursesQuizSubmissions = useQuery({
    queryKey: ['coursesQuizSubmissions', userId],
    queryFn: async () => unwrapApiResponse(await getCoursesQuizSubmissions(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const storeCoursesModuleCompletion = useMutation({
    mutationFn: async (payload: PayloadPostCoursesModuleCompletion) =>
      unwrapApiResponse(await postCoursesModuleCompletion(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coursesModuleCompletions'] });
    },
  });

  const storeCoursesQuizSubmission = useMutation({
    mutationFn: async (payload: PayloadPostCoursesQuizSubmission) =>
      unwrapApiResponse(await postCoursesQuizSubmission(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coursesQuizSubmissions'] });
    },
  });

  const storeCoursesCertificate = useMutation({
    mutationFn: async (payload: PayloadPostCoursesCertificate) =>
      unwrapApiResponse(await postCoursesCertificate(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coursesCertificate', courseId] });
    },
  });

  return {
    fetchCoursesDetail,
    fetchCoursesModuleCompletions,
    fetchCoursesQuizSubmissions,
    storeCoursesModuleCompletion,
    storeCoursesQuizSubmission,
    fetchCoursesModules,
    fetchCoursesEnrollment,
    fetchCoursesCertificate,
    fetchCoursesSettings,
    storeCoursesEnrollment,
    changeCoursesEnrollmentProgress,
    storeCoursesCertificate,
  };
};
