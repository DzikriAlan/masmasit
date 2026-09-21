import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminUserActivity } from '@server/admin/adminService';

/**
 * Who is actually using the platform, and for what. Server-only for the same
 * reason as the role distribution: the underlying counts cross RLS
 * boundaries the browser client cannot see past.
 */
export const GET = async () =>
  withAdmin(async () => {
    const data = takeData(await getAdminUserActivity());
    return successJson(data ?? [], 'User activity retrieved successfully');
  });
