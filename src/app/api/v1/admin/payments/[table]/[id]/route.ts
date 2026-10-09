import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { updateAdminPayment, PAYMENT_TABLES } from '@server/admin/adminService';
import type { PaymentTable } from '@server/admin/adminService';
import { checkAffected, checkRegionAccess } from '@server/admin/adminRegion';
import { postAuditLog } from '@server/audit/auditService';

/** Body `{ action: 'paid' | 'reset', subField?: 'dp' | 'final' }` (subField for agency_projects). */
export const PATCH = async (req: NextRequest, { params }: { params: { table: string; id: string } }) =>
  withAdmin(async (ctx) => {
    if (!(PAYMENT_TABLES as readonly string[]).includes(params.table)) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Unknown payment table.');
    }
    const table = params.table as PaymentTable;

    let body: { action?: string; subField?: string };
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    if (body.action !== 'paid' && body.action !== 'reset') {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'action must be paid or reset.');
    }
    const subField = body.subField === 'final' ? 'final' : body.subField === 'dp' ? 'dp' : undefined;
    if (table === 'agency_projects' && !subField) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'subField (dp or final) is required for agency projects.');
    }

    const denied = await checkRegionAccess(ctx, table, params.id);
    if (denied) return denied;

    const { data, error } = await updateAdminPayment(table, params.id, body.action, ctx.user.id, subField);
    if (error) return failureJson(error);
    const refused = checkAffected(data);
    if (refused) return refused;

    await postAuditLog({
      actorId: ctx.user.id,
      action: body.action === 'paid' ? 'confirm_payment' : 'reset_payment',
      entityType: table,
      entityId: params.id,
      detail: subField ? { subField } : null,
    });

    return successJson(null, body.action === 'paid' ? 'Payment marked as paid successfully' : 'Payment reset successfully');
  });
