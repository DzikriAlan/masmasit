import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, takeData, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin, withSuperAdmin } from '@server/serverAuth';
import { getAdminUsersWithRoles, postAdminRole, deleteAdminRole } from '@server/admin/adminService';
import { postAuditLog } from '@server/audit/auditService';

const ASSIGNABLE_ROLES = ['member', 'company', 'client', 'coach', 'talent', 'regional_admin', 'super_admin'];

export const GET = async (req: NextRequest) =>
  withAdmin(async () => {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const data = takeData(await getAdminUsersWithRoles(search));
    return successJson(data ?? [], 'Users retrieved successfully');
  });

export const POST = async (req: NextRequest) =>
  withSuperAdmin(async (ctx) => {
    let body: { userId?: string; role?: string; regionId?: string | null };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const details: Record<string, string[]> = {};
    if (!body.userId) details.userId = ['User is required'];
    if (!body.role) details.role = ['Role is required'];
    else if (!ASSIGNABLE_ROLES.includes(body.role)) details.role = ['Unknown role'];
    if (body.role === 'regional_admin' && !body.regionId) {
      details.regionId = ['A regional admin must be tied to a region'];
    }
    if (Object.keys(details).length > 0) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request data', details);
    }

    const { error } = await postAdminRole(body.userId!, body.role!, body.regionId ?? null);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'grant_role',
      entityType: 'user_roles',
      entityId: body.userId,
      detail: { role: body.role, regionId: body.regionId ?? null },
    });

    return successJson(null, 'Role granted successfully', { status: 201 });
  });

export const DELETE = async (req: NextRequest) =>
  withSuperAdmin(async (ctx) => {
    const userId = req.nextUrl.searchParams.get('userId');
    const role = req.nextUrl.searchParams.get('role');

    if (!userId || !role) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'userId and role are required.');
    }
    if (userId === ctx.user.id && role === 'super_admin') {
      return errorJson(API_ERROR_CODE.FORBIDDEN, 'You cannot revoke your own super admin role.');
    }

    const { error } = await deleteAdminRole(userId, role);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'revoke_role',
      entityType: 'user_roles',
      entityId: userId,
      detail: { role },
    });

    return successJson(null, 'Role revoked successfully');
  });
