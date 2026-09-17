import { successJson, failureJson } from '@server/apiResponse';
import { getExternalJobs } from '@server/jobs/externalJobsService';

// Public — REST.md Bagian 5: browsing needs no account, only acting does.
// No `withAuth`/`withAdmin` wrapper here on purpose.
export const GET = async () => {
  try {
    const jobs = await getExternalJobs();
    return successJson(jobs, 'External jobs retrieved successfully');
  } catch (error) {
    return failureJson(error);
  }
};
