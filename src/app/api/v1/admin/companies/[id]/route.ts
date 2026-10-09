import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminCompanyApproval } from '@server/admin/adminService';
import { checkAffected, checkRegionAccess } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

/** Company approval — region-checked against the owner's region. */
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

    const denied = await checkRegionAccess(ctx, 'companies', params.id);
    if (denied) return denied;

    const { data, error } = await updateAdminCompanyApproval(params.id, body.status);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: body.status === 'approved' ? 'approve' : 'reject',
      entityType: 'companies',
      entityId: params.id,
    });

    return successJson(null, `Company ${body.status} successfully`);
  });
