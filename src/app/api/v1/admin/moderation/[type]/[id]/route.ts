import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import {
  deleteAdminModeration,
  updateAdminBuildSpotlight,
  updateAdminDiscussionFeatured,
  MODERATION_TABLE,
  MODERATION_TYPES,
} from '@server/admin/adminService';
import type { ModerationType } from '@server/admin/adminService';
import { checkAffected, checkRegionAccess } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

type Params = { params: { type: string; id: string } };

const parseType = (raw: string) => (MODERATION_TYPES as readonly string[]).includes(raw) ? (raw as ModerationType) : null;

/**
 * Discussions: `{ is_featured: boolean }` (TC-09-04).
 * Builds / Spotlight: `{ promoted_to_spotlight: false }` takes a build down
 * from Spotlight without deleting it (TC-09-13).
 */
export const PATCH = async (req: NextRequest, { params }: Params) =>
  withAdmin(async (ctx) => {
    const type = parseType(params.type);
    if (!type) return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Unknown moderation type.');

    let body: { is_featured?: unknown; promoted_to_spotlight?: unknown };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const table = MODERATION_TABLE[type];
    const isFeatureToggle = type === 'discussions' && typeof body.is_featured === 'boolean';
    const isSpotlightToggle = table === 'builds' && typeof body.promoted_to_spotlight === 'boolean';
    if (!isFeatureToggle && !isSpotlightToggle) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Nothing to update for this content type.');
    }

    const denied = await checkRegionAccess(ctx, table, params.id);
    if (denied) return denied;

    const { data, error } = isFeatureToggle
      ? await updateAdminDiscussionFeatured(params.id, body.is_featured as boolean)
      : await updateAdminBuildSpotlight(params.id, body.promoted_to_spotlight as boolean);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    const action = isFeatureToggle
      ? (body.is_featured ? 'feature' : 'unfeature')
      : (body.promoted_to_spotlight ? 'update_status' : 'take_down');

    await postAuditLog({
      actorId: ctx.user.id,
      action,
      entityType: table,
      entityId: params.id,
      detail: isFeatureToggle ? { is_featured: body.is_featured } : { promoted_to_spotlight: body.promoted_to_spotlight },
    });

    return successJson(null, 'Content updated successfully');
  });

export const DELETE = async (_req: NextRequest, { params }: Params) =>
  withAdmin(async (ctx) => {
    const type = parseType(params.type);
    if (!type) return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Unknown moderation type.');

    const table = MODERATION_TABLE[type];
    const denied = await checkRegionAccess(ctx, table, params.id);
    if (denied) return denied;

    const { data, error } = await deleteAdminModeration(type, params.id);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'delete',
      entityType: table,
      entityId: params.id,
    });

    return successJson(null, 'Content deleted successfully');
  });
