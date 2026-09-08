import type { NextRequest } from 'next/server';

import { successJson, takeData } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAuditLogs } from '@server/audit/auditService';

export const GET = async (req: NextRequest) =>
  withAdmin(async () => {
    const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? 100);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 100;
    const data = takeData(await getAuditLogs(limit));
    return successJson(data ?? [], 'Audit logs retrieved successfully');
  });
