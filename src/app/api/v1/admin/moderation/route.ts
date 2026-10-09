import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminModeration, getPageRange, toPagination, MODERATION_TYPES } from '@server/admin/adminService';
import type { ModerationType } from '@server/admin/adminService';

/** GET ?type=jobs|projects|courses|events|discussions|replies|builds|spotlight&search=&page=&limit= */
export const GET = async (req: NextRequest) =>
  withAdmin(async (ctx) => {
    const params = req.nextUrl.searchParams;
    const type = (params.get('type') ?? 'jobs') as ModerationType;
    if (!MODERATION_TYPES.includes(type)) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Unknown moderation type.');
    }

    const { page, limit, from, to } = getPageRange(params.get('page'), params.get('limit'));
    const { data, error, count } = await getAdminModeration(ctx, type, params.get('search') ?? '', from, to);
    if (error) return failureJson(error);

    return successJson(data ?? [], 'Moderation queue retrieved successfully', {
      pagination: toPagination(page, limit, count),
    });
  });
