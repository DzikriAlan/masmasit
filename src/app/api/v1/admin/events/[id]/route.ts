import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminEventApproval } from '@server/admin/adminService';
import { postAuditLog } from '@server/audit/auditService';

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: { status?: string };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    if (body.status !== 'approved' && body.status !== 'rejected') {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Status must be approved or rejected.');
    }

    const { error } = await updateAdminEventApproval(params.id, body.status);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: body.status === 'approved' ? 'approve' : 'reject',
      entityType: 'events',
      entityId: params.id,
    });

    return successJson(null, `Event ${body.status} successfully`);
  });
