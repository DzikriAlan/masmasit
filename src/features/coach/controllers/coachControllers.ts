import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteCoachCourses,
  deleteCoachMaterials,
  deleteCoachModules,
  deleteCoachQuizQuestions,
  deleteCoachQuizzes,
  getCoachCourses,
  getCoachCoursesCertificates,
  getCoachCoursesParticipants,
  postCoachCourses,
  postCoachMaterials,
  postCoachModules,
  postCoachQuizQuestions,
  postCoachQuizzes,
  updateCoachApplication,
  updateCoachCourses,
} from '../services/coachServices';
import type {
  PayloadPostCoachCourses,
  PayloadPostCoachMaterials,
  PayloadPostCoachModules,
  PayloadPostCoachQuizQuestions,
  PayloadPostCoachQuizzes,
  PayloadUpdateCoachCourses,
} from '../types/coachTypes';

export const useCoachControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidateCoachCourses = () => {
    queryClient.invalidateQueries({ queryKey: ['coachCourses', userId] });
  };

  const fetchCoachCourses = useQuery({
    queryKey: ['coachCourses', userId],
    queryFn: async () => unwrapApiResponse(await getCoachCourses(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const changeCoachApplication = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Missing user');
      return unwrapApiResponse(await updateCoachApplication(userId));
    },
  });

  const storeCoachCourses = useMutation({
    mutationFn: async (payload: PayloadPostCoachCourses) =>
      unwrapApiResponse(await postCoachCourses(payload)),
    onSuccess: invalidateCoachCourses,
  });

  const modifyCoachCourses = useMutation({
    mutationFn: async (payload: { courseId: string; data: PayloadUpdateCoachCourses }) =>
      unwrapApiResponse(await updateCoachCourses(payload.courseId, payload.data)),
    onSuccess: invalidateCoachCourses,
  });

  const removeCoachCourses = useMutation({
    mutationFn: async (courseId: string) => unwrapApiResponse(await deleteCoachCourses(courseId)),
    onSuccess: () => {
      invalidateCoachCourses();
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const storeCoachModules = useMutation({
    mutationFn: async (payload: PayloadPostCoachModules) =>
      unwrapApiResponse(await postCoachModules(payload)),
    onSuccess: invalidateCoachCourses,
  });

  const removeCoachModules = useMutation({
    mutationFn: async (moduleId: string) => unwrapApiResponse(await deleteCoachModules(moduleId)),
    onSuccess: invalidateCoachCourses,
  });

  const storeCoachMaterials = useMutation({
    mutationFn: async (payload: PayloadPostCoachMaterials) =>
      unwrapApiResponse(await postCoachMaterials(payload)),
    onSuccess: invalidateCoachCourses,
  });

  const removeCoachMaterials = useMutation({
    mutationFn: async (materialId: string) => unwrapApiResponse(await deleteCoachMaterials(materialId)),
    onSuccess: invalidateCoachCourses,
  });

  const storeCoachQuizzes = useMutation({
    mutationFn: async (payload: PayloadPostCoachQuizzes) =>
      unwrapApiResponse(await postCoachQuizzes(payload)),
    onSuccess: invalidateCoachCourses,
  });

  const removeCoachQuizzes = useMutation({
    mutationFn: async (quizId: string) => unwrapApiResponse(await deleteCoachQuizzes(quizId)),
    onSuccess: invalidateCoachCourses,
  });

  const storeCoachQuizQuestions = useMutation({
    mutationFn: async (payload: PayloadPostCoachQuizQuestions) =>
      unwrapApiResponse(await postCoachQuizQuestions(payload)),
    onSuccess: invalidateCoachCourses,
  });

  const removeCoachQuizQuestions = useMutation({
    mutationFn: async (questionId: string) =>
      unwrapApiResponse(await deleteCoachQuizQuestions(questionId)),
    onSuccess: invalidateCoachCourses,
  });

  return {
    fetchCoachCourses,
    changeCoachApplication,
    storeCoachCourses,
    modifyCoachCourses,
    removeCoachCourses,
    storeCoachModules,
    removeCoachModules,
    storeCoachMaterials,
    removeCoachMaterials,
    storeCoachQuizzes,
    removeCoachQuizzes,
    storeCoachQuizQuestions,
    removeCoachQuizQuestions,
  };
};

/** Participants of one course: enrollment, payment, progress and certificate. */
export const useCoachParticipantsControllers = (courseId: string | null) => {
  const fetchCoachCoursesParticipants = useQuery({
    queryKey: ['coachCoursesParticipants', courseId],
    queryFn: async () => unwrapApiResponse(await getCoachCoursesParticipants(courseId as string)) ?? [],
    enabled: Boolean(courseId),
  });

  const fetchCoachCoursesCertificates = useQuery({
    queryKey: ['coachCoursesCertificates', courseId],
    queryFn: async () => unwrapApiResponse(await getCoachCoursesCertificates(courseId as string)) ?? [],
    enabled: Boolean(courseId),
  });

  return { fetchCoachCoursesParticipants, fetchCoachCoursesCertificates };
};
