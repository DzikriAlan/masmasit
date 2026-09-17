import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminTeamCollabs } from '@server/admin/adminService';

export const GET = async () =>
  withAdmin(async () => {
    const data = takeData(await getAdminTeamCollabs());
    return successJson(data ?? [], 'Team Collabs retrieved successfully');
  });
