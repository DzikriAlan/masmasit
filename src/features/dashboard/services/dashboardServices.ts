import { supabase } from '@/shared/lib/supabase';
import { errorResponse, successResponse, API_ERROR_CODE } from '@/shared/lib/apiResponse';

import type { DataDashboard, MonthlyActivity, SkillDistribution, ApplicationStatus } from '../types/dashboardTypes';

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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getDashboardMonthlyActivity = async (userId: string) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const since = sixMonthsAgo.toISOString();

    const [apps, projs, enrs, rsvps] = await Promise.all([
      supabase.from('job_applications').select('created_at').eq('user_id', userId).gte('created_at', since),
      supabase.from('projects').select('created_at').eq('user_id', userId).gte('created_at', since),
      supabase.from('enrollments').select('created_at').eq('user_id', userId).gte('created_at', since),
      supabase.from('event_rsvps').select('created_at').eq('user_id', userId).gte('created_at', since),
    ]);

    const months: MonthlyActivity[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ month: MONTH_NAMES[d.getMonth()], applications: 0, projects: 0, enrollments: 0, rsvps: 0 });

      const inMonth = (row: { created_at: string }) => row.created_at.startsWith(key);
      months[months.length - 1].applications = (apps.data ?? []).filter(inMonth).length;
      months[months.length - 1].projects = (projs.data ?? []).filter(inMonth).length;
      months[months.length - 1].enrollments = (enrs.data ?? []).filter(inMonth).length;
      months[months.length - 1].rsvps = (rsvps.data ?? []).filter(inMonth).length;
    }

    return successResponse<MonthlyActivity[]>(months, 'Monthly activity retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

export const getDashboardSkillDistribution = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_skills')
      .select('skill_id, skills(name)')
      .eq('user_id', userId);

    if (error) return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, error.message);

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const joined = row.skills as unknown as { name: string } | null;
      const name = joined?.name ?? 'Unknown';
      counts[name] = (counts[name] ?? 0) + 1;
    }

    const result: SkillDistribution[] = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return successResponse<SkillDistribution[]>(result, 'Skill distribution retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

export const getDashboardApplicationStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('status')
      .eq('user_id', userId);

    if (error) return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, error.message);

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const status = row.status ?? 'pending';
      counts[status] = (counts[status] ?? 0) + 1;
    }

    const result: ApplicationStatus[] = Object.entries(counts)
      .map(([status, count]) => ({ status, count }));

    return successResponse<ApplicationStatus[]>(result, 'Application status retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};
