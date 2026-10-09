import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminPersonApproval } from '@server/admin/adminService';
import { checkAffected, checkRegionAccess } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

const FIELDS = ['coach_approved', 'talent_approved'] as const;

/** Coach / Talent badge approval — region-checked against the member's region. */
export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: { field?: string; status?: string };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const field = FIELDS.find((f) => f === body.field);
    if (!field) return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'field must be coach_approved or talent_approved.');
    if (body.status !== 'approved' && body.status !== 'rejected') {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Status must be approved or rejected.');
    }

    const denied = await checkRegionAccess(ctx, 'profiles', params.id);
    if (denied) return denied;

    const { data, error } = await updateAdminPersonApproval(params.id, field, body.status);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: body.status === 'approved' ? 'approve' : 'reject',
      entityType: 'profiles',
      entityId: params.id,
      detail: { field },
    });

    return successJson(null, `Application ${body.status} successfully`);
  });
