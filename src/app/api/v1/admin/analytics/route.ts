import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminRoleDistribution } from '@server/admin/adminService';

/**
 * Role distribution has to come from the server: the `user_roles` RLS policy
 * lets a caller read every row only once `is_admin()` passes, and the browser
 * client used to silently return just the viewer's own roles.
 */
export const GET = async () =>
  withAdmin(async () => {
    const data = takeData(await getAdminRoleDistribution());
    return successJson(data ?? [], 'Role distribution retrieved successfully');
  });
