import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminCaseStudy, deleteAdminCaseStudy } from '@server/admin/adminService';
import { checkAffected } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    // Only the editable columns; id / created_at stay server-owned.
    const allowed = ['title', 'client_name', 'challenge', 'solution', 'result', 'image_url', 'category'];
    const patch = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
    if (Object.keys(patch).length === 0) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Nothing to update.');
    }

    const { data, error } = await updateAdminCaseStudy(params.id, patch);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'update',
      entityType: 'case_studies',
      entityId: params.id,
      detail: { fields: Object.keys(patch).join(', ') },
    });

    return successJson(null, 'Case study updated successfully');
  });

export const DELETE = async (_req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    const { error } = await deleteAdminCaseStudy(params.id);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'delete',
      entityType: 'case_studies',
      entityId: params.id,
    });

    return successJson(null, 'Case study deleted successfully');
  });
