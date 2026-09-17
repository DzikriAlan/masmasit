import type { NextRequest } from 'next/server';

import { successJson, errorJson, failureJson, takeData, API_ERROR_CODE } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminArticles, postAdminArticle } from '@server/admin/adminService';
import { postAuditLog } from '@server/audit/auditService';

export const GET = async () =>
  withAdmin(async () => {
    const data = takeData(await getAdminArticles());
    return successJson(data ?? [], 'Articles retrieved successfully');
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
    if (!body.excerpt) details.excerpt = ['Excerpt is required'];
    if (!body.body) details.body = ['Body is required'];
    if (Object.keys(details).length > 0) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'Invalid request data', details);
    }

    const { error } = await postAdminArticle({ ...body, author_id: ctx.user.id });
    if (error) return failureJson(error);

    await postAuditLog({
      actorId: ctx.user.id,
      action: 'update_status',
      entityType: 'articles',
      detail: { title: body.title },
    });

    return successJson(null, 'Article created successfully', { status: 201 });
  });
