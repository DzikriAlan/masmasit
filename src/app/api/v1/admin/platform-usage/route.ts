import { successJson } from '@server/apiResponse';
import { withSuperAdmin } from '@server/serverAuth';
import { getAdminPlatformUsage } from '@server/admin/adminService';

/**
 * Free-plan usage for the admin Limits tab. Answers null until migration 037
 * is applied, so the tab can say so instead of failing.
 */
export const GET = async () =>
  withSuperAdmin(async () => {
    const { data, error } = await getAdminPlatformUsage();
    if (error?.code === 'PGRST202') return successJson(null, 'Platform usage function is not installed yet');
    if (error) throw error;
    return successJson(data, 'Platform usage retrieved successfully');
  });
