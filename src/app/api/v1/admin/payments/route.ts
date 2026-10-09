import { successJson, failureJson } from '@server/apiResponse';
import { withAdmin } from '@server/serverAuth';
import { getAdminPayments } from '@server/admin/adminService';

/** Pending payments across bookings, courses, events and agency projects — region-scoped. */
export const GET = async () =>
  withAdmin(async (ctx) => {
    const { data, error } = await getAdminPayments(ctx);
    if (error) return failureJson(error);
    return successJson(data ?? [], 'Pending payments retrieved successfully');
  });
