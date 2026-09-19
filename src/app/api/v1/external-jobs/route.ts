import { successJson, failureJson } from '@server/apiResponse';
import { getExternalJobs } from '@server/jobs/externalJobsService';

// Public — REST.md Bagian 5: browsing needs no account, only acting does.
// No `withAuth`/`withAdmin` wrapper here on purpose.
export const GET = async (request: Request) => {
  try {
    const q = new URL(request.url).searchParams.get('q') ?? undefined;
    const jobs = await getExternalJobs(q);
    return successJson(jobs, 'External jobs retrieved successfully');
  } catch (error) {
    return failureJson(error);
  }
};
