import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminAgencyApproval, updateAdminAgency, deleteAdminAgency } from '@server/admin/adminService';
import { checkAffected, checkRegionAccess } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

const EDITABLE_FIELDS = ['name', 'description', 'logo_url'] as const;

/**
 * Body `{ status }` approves / rejects (REST.md Bagian 7); any of
 * name / description / logo_url edits the agency (TC-14-07).
 */
export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const denied = await checkRegionAccess(ctx, 'agencies', params.id);
    if (denied) return denied;

    if (body.status !== undefined) {
      if (body.status !== 'approved' && body.status !== 'rejected') {
        return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Status must be approved or rejected.');
      }

      const { data, error } = await updateAdminAgencyApproval(params.id, body.status);
      if (error) return failureJson(error);
      const refused = checkAffected(data);
      if (refused) return refused;

      await postAuditLog({
        actorId: ctx.user.id,
        action: body.status === 'approved' ? 'approve' : 'reject',
        entityType: 'agencies',
        entityId: params.id,
      });

      return successJson(null, `Agency ${body.status} successfully`);
    }

    const patch: Record<string, unknown> = {};
    EDITABLE_FIELDS.forEach((field) => {
      if (body[field] !== undefined) patch[field] = body[field] === '' && field === 'logo_url' ? null : body[field];
    });

    const details: Record<string, string[]> = {};
    if (Object.keys(patch).length === 0) details.body = ['Nothing to update'];
    if (patch.name !== undefined && !String(patch.name).trim()) details.name = ['Name is required'];
    if (patch.description !== undefined && !String(patch.description).trim()) details.description = ['Description is required'];
    if (Object.keys(details).length > 0) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request data', details);
    }

    const { data, error } = await updateAdminAgency(params.id, patch);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'update',
      entityType: 'agencies',
      entityId: params.id,
      detail: { fields: Object.keys(patch).join(', ') },
    });

    return successJson(null, 'Agency updated successfully');
  });

export const DELETE = async (_req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    const denied = await checkRegionAccess(ctx, 'agencies', params.id);
    if (denied) return denied;

    const { data, error } = await deleteAdminAgency(params.id);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'delete',
      entityType: 'agencies',
      entityId: params.id,
    });

    return successJson(null, 'Agency deleted successfully');
  });
