import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminAgencies } from '@server/admin/adminService';

/** Every agency (any approval status) in the caller's region. */
export const GET = async () =>
  withAdmin(async (ctx) => {
    const data = takeData(await getAdminAgencies(ctx));
    return successJson(data ?? [], 'Agencies retrieved successfully');
  });
