import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataCourses,
  DataCoursesDetail,
  DataCoursesEnrollment,
  DataCoursesModule,
  DataCoursesModuleCompletion,
  DataCoursesEnrolled,
  DataCoursesQuizSubmission,
  PayloadPostCoursesCertificate,
  PayloadPostCoursesEnrollment,
  PayloadPostCoursesModuleCompletion,
  PayloadPostCoursesQuizSubmission,
} from '../types/coursesTypes';

export const getCourses = async () => {
  return toApiResponse<DataCourses[]>(
    supabase
      .from('courses')
      .select('*, profiles(full_name), enrollments(id)')
      .order('created_at', { ascending: false }),
    'Courses retrieved successfully'
  );
};

export const getCoursesDetail = async (id: string) => {
  return toApiResponse<DataCoursesDetail>(
    supabase.from('courses').select('*, profiles(full_name)').eq('id', id).maybeSingle(),
    'Course retrieved successfully'
  );
};

export const getCoursesModules = async (courseId: string) => {
  return toApiResponse<DataCoursesModule[]>(
    supabase
      .from('course_modules')
      .select('*, course_materials(*), quizzes(*, quiz_questions(*))')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    'Modules retrieved successfully'
  );
};

export const getCoursesEnrollment = async (courseId: string, userId: string) => {
  return toApiResponse<DataCoursesEnrollment>(
    supabase
      .from('enrollments')
      .select('id, progress, payment_status')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle(),
    'Enrollment retrieved successfully'
  );
};

export const getCoursesCertificate = async (courseId: string, userId: string) => {
  return toApiResponse<{ id: string }>(
    supabase
      .from('certificates')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle(),
    'Certificate retrieved successfully'
  );
};

export const getCoursesSettings = async () => {
  return toApiResponse<{ lynkid_courses_url: string | null }>(
    supabase.from('app_settings').select('lynkid_courses_url').maybeSingle(),
    'Course settings retrieved successfully'
  );
};

export const postCoursesEnrollment = async (payload: PayloadPostCoursesEnrollment) => {
  return toApiResponse<{ id: string }>(
    supabase.from('enrollments').insert(payload).select('id').single(),
    'Enrolled successfully'
  );
};

export const updateCoursesEnrollmentProgress = async (enrollmentId: string, progress: number) => {
  return toApiResponse<null>(
    supabase.from('enrollments').update({ progress }).eq('id', enrollmentId),
    'Progress updated successfully'
  );
};

export const postCoursesCertificate = async (payload: PayloadPostCoursesCertificate) => {
  return toApiResponse<null>(
    supabase.from('certificates').insert(payload),
    'Certificate issued successfully'
  );
};

export const getCoursesModuleCompletions = async (enrollmentId: string) => {
  return toApiResponse<DataCoursesModuleCompletion[]>(
    supabase.from('module_completions').select('id, module_id').eq('enrollment_id', enrollmentId),
    'Module completions retrieved successfully'
  );
};

export const postCoursesModuleCompletion = async (payload: PayloadPostCoursesModuleCompletion) => {
  return toApiResponse<null>(
    supabase.from('module_completions').insert(payload),
    'Module marked complete successfully'
  );
};

export const getCoursesQuizSubmissions = async (userId: string) => {
  return toApiResponse<DataCoursesQuizSubmission[]>(
    supabase.from('quiz_submissions').select('id, quiz_id, score, passed').eq('user_id', userId),
    'Quiz submissions retrieved successfully'
  );
};

export const postCoursesQuizSubmission = async (payload: PayloadPostCoursesQuizSubmission) => {
  return toApiResponse<null>(
    supabase.from('quiz_submissions').insert(payload),
    'Quiz submitted successfully'
  );
};

/**
 * Courses the signed-in member is enrolled in, with progress.
 * PostgREST types an embedded to-one relation as an array, while it arrives as
 * a single object at runtime, so the builder is widened before wrapping.
 */
export const getCoursesMine = async (userId: string) => {
  const query = supabase
    .from('enrollments')
    .select('id, progress, payment_status, courses(*, profiles(full_name))')
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  return toApiResponse<DataCoursesEnrolled[]>(
    query as unknown as PromiseLike<{ data: DataCoursesEnrolled[] | null; error: null }>,
    'Enrolled courses retrieved successfully'
  );
};
