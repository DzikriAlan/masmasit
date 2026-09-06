import { supabase } from '@/shared/lib/supabase';

export const getCourses = async () => {
  return supabase
    .from('courses')
    .select('*, profiles(full_name), enrollments(id)')
    .order('created_at', { ascending: false });
};

export const getCourseDetail = async (id: string) => {
  return supabase.from('courses').select('*, profiles(full_name)').eq('id', id).maybeSingle();
};

export const getCourseModules = async (courseId: string) => {
  return supabase
    .from('course_modules')
    .select('*, course_materials(*), quizzes(*, quiz_questions(*))')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
};

export const getEnrollment = async (courseId: string, userId: string) => {
  return supabase
    .from('enrollments')
    .select('id, progress, payment_status')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();
};

export const getCertificate = async (courseId: string, userId: string) => {
  return supabase
    .from('certificates')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();
};

export const getCoursesSettings = async () => {
  return supabase.from('app_settings').select('lynkid_courses_url').maybeSingle();
};

export const postEnrollment = async (payload: { course_id: string; user_id: string }) => {
  return supabase.from('enrollments').insert(payload).select('id').single();
};

export const updateEnrollmentProgress = async (enrollmentId: string, progress: number) => {
  return supabase.from('enrollments').update({ progress }).eq('id', enrollmentId);
};

export const postCertificate = async (payload: { course_id: string; user_id: string }) => {
  return supabase.from('certificates').insert(payload);
};
