import type { NextRequest } from 'next/server';

import { successJson, failureJson } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminMembers, getPageRange, toPagination } from '@server/admin/adminService';

/** GET ?search=&suspended=true&page=&limit= — members in the caller's region. */
export const GET = async (req: NextRequest) =>
  withAdmin(async (ctx) => {
    const params = req.nextUrl.searchParams;
    const { page, limit, from, to } = getPageRange(params.get('page'), params.get('limit'));
    const { data, error, count } = await getAdminMembers(
      ctx,
      params.get('search') ?? '',
      params.get('suspended') === 'true',
      from,
      to
    );
    if (error) return failureJson(error);

    return successJson(data ?? [], 'Members retrieved successfully', {
      pagination: toPagination(page, limit, count),
    });
  });
