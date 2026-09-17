import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminTeamCollabsMatch } from '@server/admin/adminService';
import { postAuditLog } from '@server/audit/auditService';

// REST.md Bagian 6.2: the admin names who the team was matched with — the
// only field a client-side update can never move (guard_team_collabs_match,
// migration 015), so this is the one legitimate path to "Matched".
export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: { matched_with?: string };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    if (!body.matched_with?.trim()) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'matched_with is required.');
    }

    const { error } = await updateAdminTeamCollabsMatch(params.id, body.matched_with);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'update_status',
      entityType: 'team_collabs',
      entityId: params.id,
      detail: { matched_with: body.matched_with },
    });

    return successJson(null, 'Marked as matched');
  });
