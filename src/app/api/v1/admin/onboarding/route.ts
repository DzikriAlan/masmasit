import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminOnboarding } from '@server/admin/adminService';

/** Onboarding popup answers for every member, for the admin Onboarding tab. */
export const GET = async () =>
  withAdmin(async () => {
    const data = takeData(await getAdminOnboarding());
    return successJson(data ?? [], 'Onboarding answers retrieved successfully');
  });
