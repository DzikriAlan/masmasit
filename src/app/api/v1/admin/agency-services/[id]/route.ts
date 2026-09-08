import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminAgencyService, deleteAdminAgencyService } from '@server/admin/adminService';
import { postAuditLog } from '@server/audit/auditService';

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const { error } = await updateAdminAgencyService(params.id, body);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'update_status',
      entityType: 'agency_services',
      entityId: params.id,
      detail: body,
    });

    return successJson(null, 'Agency service updated successfully');
  });

export const DELETE = async (_req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    const { error } = await deleteAdminAgencyService(params.id);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'delete',
      entityType: 'agency_services',
      entityId: params.id,
    });

    return successJson(null, 'Agency service deleted successfully');
  });
