import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, takeData, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminAgencyServices, postAdminAgencyService } from '@server/admin/adminService';
import { postAuditLog } from '@server/audit/auditService';

const CATEGORIES = ['SaaS', 'AI Solutions', 'Creative Services', 'HR Solutions'];

export const GET = async () =>
  withAdmin(async () => {
    const data = takeData(await getAdminAgencyServices());
    return successJson(data ?? [], 'Agency services retrieved successfully');
  });

export const POST = async (req: NextRequest) =>
  withAdmin(async (ctx) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const details: Record<string, string[]> = {};
    if (!body.title) details.title = ['Title is required'];
    if (!body.description) details.description = ['Description is required'];
    if (!body.category) details.category = ['Category is required'];
    else if (!CATEGORIES.includes(String(body.category))) details.category = ['Unknown category'];
    if (Object.keys(details).length > 0) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request data', details);
    }

    const { error } = await postAdminAgencyService({
      title: body.title,
      description: body.description,
      category: body.category,
      base_price: body.base_price ?? null,
      is_active: body.is_active ?? true,
    });
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'update_status',
      entityType: 'agency_services',
      detail: { title: body.title },
    });

    return successJson(null, 'Agency service created successfully', { status: 201 });
  });
