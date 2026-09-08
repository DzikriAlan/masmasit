import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, takeData, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminCaseStudies, postAdminCaseStudy } from '@server/admin/adminService';
import { postAuditLog } from '@server/audit/auditService';

export const GET = async () =>
  withAdmin(async () => {
    const data = takeData(await getAdminCaseStudies());
    return successJson(data ?? [], 'Case studies retrieved successfully');
  });

export const POST = async (req: NextRequest) =>
  withAdmin(async (ctx) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request body.');
    }

    const details: Record<string, string[]> = {};
    if (!body.title) details.title = ['Title is required'];
    if (!body.client_name) details.client_name = ['Client name is required'];
    if (!body.challenge) details.challenge = ['Challenge is required'];
    if (!body.solution) details.solution = ['Solution is required'];
    if (!body.result) details.result = ['Result is required'];
    if (Object.keys(details).length > 0) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request data', details);
    }

    const { error } = await postAdminCaseStudy(body);
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'update_status',
      entityType: 'case_studies',
      detail: { title: body.title },
    });

    return successJson(null, 'Case study created successfully', { status: 201 });
  });
