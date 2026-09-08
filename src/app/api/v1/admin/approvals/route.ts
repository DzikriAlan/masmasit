import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminPendingApprovals } from '@server/admin/adminService';

export const GET = async () =>
  withAdmin(async (ctx) => {
    const { companies, people, events } = await getAdminPendingApprovals(ctx);

    return successJson(
      {
        companies: takeData(companies) ?? [],
        people: takeData(people) ?? [],
        events: takeData(events) ?? [],
      },
      'Pending approvals retrieved successfully'
    );
  });
