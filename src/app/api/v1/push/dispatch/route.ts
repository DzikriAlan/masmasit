import { timingSafeEqual } from 'node:crypto';

import { API_ERROR_CODE, errorJson, failureJson, successJson } from '@server/apiResponse';
import { sendNotificationPush } from '@server/push/fcmService';

export const dynamic = 'force-dynamic';

const authorized = (request: Request) => {
  const secret = process.env.PUSH_DISPATCH_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

// Called by the database, not by browsers: the dispatch_notification_push
// trigger (migration 036) posts here through pg_net for every new
// notification row. Guarded by a shared secret instead of a user session.
export const POST = async (request: Request) => {
  if (!authorized(request)) {
    return errorJson(API_ERROR_CODE.UNAUTHORIZED, 'Invalid dispatch secret.');
  }
  try {
    const body = (await request.json().catch(() => null)) as { notification_id?: unknown } | null;
    const notificationId = body?.notification_id;
    if (typeof notificationId !== 'string' || !notificationId) {
      return errorJson(API_ERROR_CODE.VALIDATION_ERROR, 'notification_id is required.', {
        notification_id: ['Required'],
      });
    }
    const result = await sendNotificationPush(notificationId);
    return successJson(result, 'Push dispatched successfully');
  } catch (error) {
    console.error('[push/dispatch]', error);
    return failureJson(error);
  }
};
