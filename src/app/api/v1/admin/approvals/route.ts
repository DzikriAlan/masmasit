import type { NextRequest } from 'next/server';

import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminPendingApprovals } from '@server/admin/adminService';

/** ?all=true returns every company / coach-talent application, not only pending. */
export const GET = async (req: NextRequest) =>
  withAdmin(async (ctx) => {
    const includeAll = req.nextUrl.searchParams.get('all') === 'true';
    const { companies, people, events, agencies } = await getAdminPendingApprovals(ctx, includeAll);

    return successJson(
      {
        companies: takeData(companies) ?? [],
        people: takeData(people) ?? [],
        events: takeData(events) ?? [],
        agencies: takeData(agencies) ?? [],
      },
      'Pending approvals retrieved successfully'
    );
  });
