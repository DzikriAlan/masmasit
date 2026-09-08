import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataCoachCourses,
  PayloadPostCoachCourses,
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
