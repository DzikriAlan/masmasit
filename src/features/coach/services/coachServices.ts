import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataCoachCourses,
  DataCoachCoursesCertificate,
  DataCoachCoursesParticipant,
  PayloadPostCoachCourses,
  PayloadUpdateCoachCourses,
  PayloadPostCoachMaterials,
  PayloadPostCoachModules,
  PayloadPostCoachQuizQuestions,
  PayloadPostCoachQuizzes,
} from '../types/coachTypes';

export const getCoachCourses = async (coachId: string) => {
  return toApiResponse<DataCoachCourses[]>(
    supabase
      .from('courses')
      .select('*, enrollments(id), course_modules(*, course_materials(*), quizzes(*, quiz_questions(*)))')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false }),
    'Coach courses retrieved successfully'
  );
};

export const updateCoachApplication = async (userId: string) => {
  return toApiResponse<null>(
    supabase.from('profiles').update({ is_coach: true, coach_approved: 'pending' }).eq('id', userId),
    'Coach application submitted successfully'
  );
};

export const postCoachCourses = async (payload: PayloadPostCoachCourses) => {
  return toApiResponse<null>(supabase.from('courses').insert(payload), 'Course created successfully');
};

/** `.select('id')` so an update RLS silently filtered out reads as an error, not success. */
export const updateCoachCourses = async (courseId: string, payload: PayloadUpdateCoachCourses) => {
  return toApiResponse<{ id: string }>(
    supabase.from('courses').update(payload).eq('id', courseId).select('id').single(),
    'Course updated successfully'
  );
};

/** The guard_course_delete trigger rejects a course that has paid participants. */
export const deleteCoachCourses = async (courseId: string) => {
  return toApiResponse<{ id: string }>(
    supabase.from('courses').delete().eq('id', courseId).select('id').single(),
    'Course deleted successfully'
  );
};

export const getCoachCoursesParticipants = async (courseId: string) => {
  const query = supabase
    .from('enrollments')
    .select('id, user_id, enrolled_at, payment_status, progress, profiles(full_name, email)')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });

  return toApiResponse<DataCoachCoursesParticipant[]>(
    query as unknown as PromiseLike<{ data: DataCoachCoursesParticipant[] | null; error: null }>,
    'Participants retrieved successfully'
  );
};

export const getCoachCoursesCertificates = async (courseId: string) => {
  return toApiResponse<DataCoachCoursesCertificate[]>(
    supabase.from('certificates').select('user_id, issued_at').eq('course_id', courseId),
    'Certificates retrieved successfully'
  );
};

export const postCoachModules = async (payload: PayloadPostCoachModules) => {
  return toApiResponse<null>(
    supabase.from('course_modules').insert(payload),
    'Module created successfully'
  );
};

export const deleteCoachModules = async (moduleId: string) => {
  return toApiResponse<null>(
    supabase.from('course_modules').delete().eq('id', moduleId),
    'Module deleted successfully'
  );
};

export const postCoachMaterials = async (payload: PayloadPostCoachMaterials) => {
  return toApiResponse<null>(
    supabase.from('course_materials').insert(payload),
    'Material created successfully'
  );
};

export const deleteCoachMaterials = async (materialId: string) => {
  return toApiResponse<null>(
    supabase.from('course_materials').delete().eq('id', materialId),
    'Material deleted successfully'
  );
};

export const postCoachQuizzes = async (payload: PayloadPostCoachQuizzes) => {
  return toApiResponse<null>(supabase.from('quizzes').insert(payload), 'Quiz created successfully');
};

export const deleteCoachQuizzes = async (quizId: string) => {
  return toApiResponse<null>(
    supabase.from('quizzes').delete().eq('id', quizId),
    'Quiz deleted successfully'
  );
};

export const postCoachQuizQuestions = async (payload: PayloadPostCoachQuizQuestions) => {
  return toApiResponse<null>(
    supabase.from('quiz_questions').insert(payload),
    'Question created successfully'
  );
};

export const deleteCoachQuizQuestions = async (questionId: string) => {
  return toApiResponse<null>(
    supabase.from('quiz_questions').delete().eq('id', questionId),
    'Question deleted successfully'
  );
};
