import type { NextRequest } from 'next/server';

import { successJson, failureJson } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminApplications, getPageRange, toPagination } from '@server/admin/adminService';

/** GET ?search=&page=&limit= — every job application, newest first (TC-00-11). */
export const GET = async (req: NextRequest) =>
  withAdmin(async (ctx) => {
    const params = req.nextUrl.searchParams;
    const { page, limit, from, to } = getPageRange(params.get('page'), params.get('limit'));
    const { data, error, count } = await getAdminApplications(ctx, params.get('search') ?? '', from, to);
    if (error) return failureJson(error);

    return successJson(data ?? [], 'Applications retrieved successfully', {
      pagination: toPagination(page, limit, count),
    });
  });
