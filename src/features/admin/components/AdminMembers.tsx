'use client';

import { useEffect, useState } from 'react';
import { Ban, Loader2, Search, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { DataAdminMember } from '@/features/admin/types/adminTypes';
import { useAdminMembersControllers } from '@/features/admin/controllers/adminControllers';
import AdminPager from '@/features/admin/components/AdminPager';

const PAGE_SIZE = 20;

interface Props {
  enabled: boolean;
  currentUserId: string | undefined;
}

/**
 * Members list with suspend / restore (TC-09-16). Suspending needs a reason;
 * the server bans the login, hides the member from the directory and writes
 * the audit log.
 */
export default function AdminMembers({ enabled, currentUserId }: Props) {
  const { t } = useLang();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [suspendedOnly, setSuspendedOnly] = useState(false);
  const [target, setTarget] = useState<DataAdminMember | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { fetchAdminMembers, changeAdminMemberSuspension } = useAdminMembersControllers(
    { search, page, limit: PAGE_SIZE, suspendedOnly },
    enabled
  );

  const members = fetchAdminMembers.data?.items ?? [];
  const pagination = fetchAdminMembers.data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
  const saving = changeAdminMemberSuspension.isPending;

  const editSuspendOpen = (member: DataAdminMember) => {
    setTarget(member);
    setReason('');
  };

  const submitSuspend = async () => {
    if (!target) return;
    if (!reason.trim()) {
      toast.error(t('A reason is required', 'Alasan wajib diisi'));
      return;
    }
    try {
      await changeAdminMemberSuspension.mutateAsync({ id: target.id, data: { suspended: true, reason: reason.trim() } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to suspend', 'Gagal menangguhkan'));
      return;
    }
    toast.success(t('Member suspended', 'Member ditangguhkan'));
    setTarget(null);
  };

  const submitRestore = async (member: DataAdminMember) => {
    try {
      await changeAdminMemberSuspension.mutateAsync({ id: member.id, data: { suspended: false, reason: null } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to restore', 'Gagal memulihkan'));
      return;
    }
    toast.success(t('Member restored', 'Member dipulihkan'));
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {t('Members', 'Member')}</CardTitle>
        <CardDescription>
          {t('Suspended members cannot sign in and are hidden from the directory.', 'Member yang ditangguhkan tidak bisa login dan disembunyikan dari direktori.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('Search name or email…', 'Cari nama atau email…')}
              className="pl-9"
            />
          </div>
          <Button
            variant={suspendedOnly ? 'default' : 'outline'}
            onClick={() => {
              setSuspendedOnly(!suspendedOnly);
              setPage(1);
            }}
            className="gap-2"
          >
            <Ban className="h-4 w-4" /> {t('Suspended only', 'Hanya yang ditangguhkan')}
          </Button>
        </div>

        {fetchAdminMembers.isPending ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : fetchAdminMembers.isError ? (
          <p className="text-sm text-destructive">{fetchAdminMembers.error.message}</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No members found.', 'Tidak ada member.')}</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{m.full_name ?? m.email}</p>
                    {m.is_suspended && <Badge variant="destructive">{t('Suspended', 'Ditangguhkan')}</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[m.email, m.region?.name ?? m.location].filter(Boolean).join(' · ')}
                  </p>
                  {m.is_suspended && m.suspended_reason && (
                    <p className="mt-1 text-xs text-muted-foreground">{t('Reason', 'Alasan')}: {m.suspended_reason}</p>
                  )}
                </div>
                {m.id !== currentUserId && (
                  m.is_suspended ? (
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => submitRestore(m)} className="gap-1">
                      <UserCheck className="h-3.5 w-3.5" /> {t('Restore', 'Pulihkan')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => editSuspendOpen(m)} className="gap-1 text-destructive hover:text-destructive">
                      <Ban className="h-3.5 w-3.5" /> {t('Suspend', 'Tangguhkan')}
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        <AdminPager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      </CardContent>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Suspend member', 'Tangguhkan member')}</DialogTitle>
            <DialogDescription>
              {target?.full_name ?? target?.email} — {t('they will be signed out and hidden from the directory.', 'akan dikeluarkan dan disembunyikan dari direktori.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend-reason">{t('Reason', 'Alasan')}</Label>
            <Textarea id="suspend-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>{t('Cancel', 'Batal')}</Button>
            <Button variant="destructive" onClick={submitSuspend} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('Suspend', 'Tangguhkan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
