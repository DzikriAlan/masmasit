'use client';

import { Loader2, ScrollText } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useAdminAuditControllers } from '@/features/admin/controllers/adminControllers';

const ACTION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  approve: 'default',
  grant_role: 'default',
  reject: 'destructive',
  delete: 'destructive',
  revoke_role: 'destructive',
};

interface Props {
  enabled: boolean;
}

export default function AdminAuditLog({ enabled }: Props) {
  const { t } = useLang();
  const { fetchAdminAuditLogs } = useAdminAuditControllers(enabled);

  const logs = fetchAdminAuditLogs.data ?? [];
  const loading = fetchAdminAuditLogs.isPending;

  const formatDetail = (detail: Record<string, unknown> | null) => {
    if (!detail) return null;
    return Object.entries(detail)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(' · ');
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{t('Audit Log', 'Catatan Audit')}</CardTitle>
        <CardDescription>
          {t('Who approved, rejected, or removed what.', 'Siapa menyetujui, menolak, atau menghapus apa.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <ScrollText className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">{t('No admin activity recorded yet.', 'Belum ada aktivitas admin yang tercatat.')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const detail = formatDetail(log.detail);
              return (
                <div key={log.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
                  <Badge variant={ACTION_VARIANT[log.action] ?? 'secondary'} className="capitalize">
                    {log.action.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium">{log.entity_type}</span>
                  {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {log.profiles?.full_name ?? t('Unknown admin', 'Admin tidak diketahui')} ·{' '}
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
