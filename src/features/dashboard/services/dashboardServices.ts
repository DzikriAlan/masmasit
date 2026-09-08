import { supabase } from '@/shared/lib/supabase';
import { errorResponse, successResponse, API_ERROR_CODE } from '@/shared/lib/apiResponse';

import type { DataDashboard } from '../types/dashboardTypes';

export const getDashboardStats = async (userId: string) => {
  try {
    const [applications, projects, enrollments, rsvps] = await Promise.all([
      supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('event_rsvps').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const failed = [applications, projects, enrollments, rsvps].find((result) => result.error);
    if (failed?.error) {
      return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, failed.error.message);
    }

    return successResponse<DataDashboard>(
      {
        applications: applications.count ?? 0,
        projects: projects.count ?? 0,
        enrollments: enrollments.count ?? 0,
        rsvps: rsvps.count ?? 0,
      },
      'Dashboard stats retrieved successfully'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};
