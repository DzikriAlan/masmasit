import { getServerSupabase } from '../supabase';

export type AuditAction =
  | 'approve'
  | 'reject'
  | 'delete'
  | 'grant_role'
  | 'revoke_role'
  | 'update_settings'
  | 'confirm_payment'
  | 'reset_payment'
  | 'update_status';

/**
 * Best-effort audit trail. A failure here must never sink the operation the
 * admin actually asked for, so the error is swallowed and reported upstream
 * only through the returned flag.
 */
export const postAuditLog = async (params: {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
}) => {
  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      detail: params.detail ?? null,
    });
    return !error;
  } catch {
    return false;
  }
};

export const getAuditLogs = async (limit = 100) => {
  const supabase = getServerSupabase();
  return supabase
    .from('audit_logs')
    .select('*, profiles:actor_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
};
