import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getServerSupabase } from '@server/supabase';
import { updateAdminMemberSuspension } from '@server/admin/adminService';
import { checkRegionAccess } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

/**
 * Body `{ suspended: boolean, reason?: string }` (TC-09-16).
 * Suspending bans the auth user (no login), flags the profile (hidden from
 * the directory) and writes the audit log. A reason is required to suspend.
 */
export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: { suspended?: unknown; reason?: unknown };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    if (typeof body.suspended !== 'boolean') {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'suspended must be true or false.');
    }
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (body.suspended && !reason) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request data', { reason: ['A reason is required'] });
    }
    if (params.id === ctx.user.id) {
      return errorJson(API_ERROR_CODE.FORBIDDEN, 'You cannot suspend yourself.');
    }

    const denied = await checkRegionAccess(ctx, 'profiles', params.id);
    if (denied) return denied;

    // Admins are never suspended from the panel — revoke the role first.
    const { data: targetRoles } = await getServerSupabase()
      .from('user_roles')
      .select('role')
      .eq('user_id', params.id)
      .in('role', ['super_admin', 'regional_admin']);
    if (body.suspended && (targetRoles ?? []).length > 0) {
      return errorJson(API_ERROR_CODE.FORBIDDEN, 'Admins cannot be suspended. Revoke the admin role first.');
    }

    const { error } = await updateAdminMemberSuspension(params.id, body.suspended, reason || null, ctx.user.id);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: body.suspended ? 'suspend' : 'unsuspend',
      entityType: 'profiles',
      entityId: params.id,
      detail: body.suspended ? { reason } : null,
    });

    return successJson(null, body.suspended ? 'Member suspended' : 'Member restored');
  });
