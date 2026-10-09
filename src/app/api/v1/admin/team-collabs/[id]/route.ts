import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminTeamCollabsMatch, updateAdminTeamCollabsClose } from '@server/admin/adminService';
import { checkAffected, checkRegionAccess } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

// REST.md Bagian 6.2: the admin names who the team was matched with — the
// only field a client-side update can never move (guard_team_collabs_match,
// migration 015), so this is the one legitimate path to "Matched".
// Body `{ status: 'closed' }` instead takes the listing down (TC-14-07).
export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withAdmin(async (ctx) => {
    let body: { matched_with?: string; status?: string };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const closing = body.status === 'closed';
    if (!closing && !body.matched_with?.trim()) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'matched_with is required.');
    }

    const denied = await checkRegionAccess(ctx, 'team_collabs', params.id);
    if (denied) return denied;

    const { data, error } = closing
      ? await updateAdminTeamCollabsClose(params.id)
      : await updateAdminTeamCollabsMatch(params.id, body.matched_with!.trim());
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: closing ? 'close' : 'update_status',
      entityType: 'team_collabs',
      entityId: params.id,
      detail: closing ? { status: 'closed' } : { matched_with: body.matched_with },
    });

    return successJson(null, closing ? 'Listing closed' : 'Marked as matched');
  });
