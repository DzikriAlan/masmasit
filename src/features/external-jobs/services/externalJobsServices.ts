import { apiGet } from '@/shared/lib/api';

import type { DataExternalJobs } from '../types/externalJobsTypes';

// Hits our own /api/v1/external-jobs route, which calls Remotive's public
// API server-side (cached ~1h) — this is a live request path, not a table
// of data we seeded ourselves. See server/jobs/externalJobsService.ts.
export const getExternalJobs = async (q?: string) => {
  return apiGet<DataExternalJobs[]>('/external-jobs', { q: q || undefined });
};
