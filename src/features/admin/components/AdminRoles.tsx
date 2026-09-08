'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck, Search, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { DataAdminUser } from '@/features/admin/types/adminTypes';
import { useAdminRolesControllers } from '@/features/admin/controllers/adminControllers';

const GRANTABLE_ROLES = ['regional_admin', 'super_admin', 'coach', 'talent', 'company', 'client'];

interface Props {
  isSuperAdmin: boolean;
  currentUserId: string | undefined;
}

export default function AdminRoles({ isSuperAdmin, currentUserId }: Props) {
  const { t } = useLang();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState('regional_admin');
  const [regionId, setRegionId] = useState('');

  const { fetchAdminUsers, fetchAdminRegions, storeAdminUserRole, removeAdminUserRole } =
    useAdminRolesControllers(search, isSuperAdmin);

  const users = fetchAdminUsers.data ?? [];
  const regions = fetchAdminRegions.data ?? [];
  const loading = fetchAdminUsers.isPending;
  const saving = storeAdminUserRole.isPending || removeAdminUserRole.isPending;
  const needsRegion = role === 'regional_admin';

  const getUserRoles = (user: DataAdminUser) => user.user_roles ?? [];

  const getRegionName = (id: string | null) =>
    id ? regions.find((r) => r.id === id)?.name ?? '—' : null;

  const saveRole = async () => {
    if (!selectedUserId) return;
    if (needsRegion && !regionId) {
      toast.error(t('Choose a region for the regional admin', 'Pilih daerah untuk admin daerah'));
      return;
    }
    try {
      await storeAdminUserRole.mutateAsync({
        userId: selectedUserId,
        role,
        regionId: needsRegion ? regionId : null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to grant role', 'Gagal memberi peran'));
      return;
    }
    toast.success(t('Role granted', 'Peran diberikan'));
    setSelectedUserId(null);
    setRegionId('');
  };

  const destroyRole = async (userId: string, roleName: string) => {
    try {
      await removeAdminUserRole.mutateAsync({ userId, role: roleName });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to revoke role', 'Gagal mencabut peran'));
      return;
    }
    toast.success(t('Role revoked', 'Peran dicabut'));
  };

  if (!isSuperAdmin) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p>{t('Only a super admin can manage roles.', 'Hanya super admin yang dapat mengelola peran.')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{t('Role Management', 'Kelola Peran')}</CardTitle>
        <CardDescription>
          {t(
            'Grant or revoke platform roles. A regional admin is limited to the region you choose.',
            'Berikan atau cabut peran platform. Admin daerah hanya berwenang pada daerah yang dipilih.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('Search members by name...', 'Cari member berdasarkan nama...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t('No members found.', 'Tidak ada member ditemukan.')}
          </p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{u.full_name ?? t('Unnamed member', 'Member tanpa nama')}</p>
                    {u.location && <p className="text-xs text-muted-foreground">{u.location}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getUserRoles(u).length === 0 && (
                        <Badge variant="outline" className="text-xs">{t('No roles', 'Tanpa peran')}</Badge>
                      )}
                      {getUserRoles(u).map((r) => (
                        <Badge key={r.role} variant="secondary" className="gap-1 text-xs capitalize">
                          {r.role.replace('_', ' ')}
                          {r.region_id && <span className="opacity-70">· {getRegionName(r.region_id)}</span>}
                          <button
                            type="button"
                            aria-label={t('Revoke role', 'Cabut peran')}
                            onClick={() => destroyRole(u.id, r.role)}
                            disabled={saving || (u.id === currentUserId && r.role === 'super_admin')}
                            className="ml-1 disabled:opacity-30"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedUserId === u.id ? 'default' : 'outline'}
                    onClick={() => setSelectedUserId(selectedUserId === u.id ? null : u.id)}
                    className="gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> {t('Grant role', 'Beri peran')}
                  </Button>
                </div>

                {selectedUserId === u.id && (
                  <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>{t('Role', 'Peran')}</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRANTABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {needsRegion && (
                      <div className="space-y-2">
                        <Label>{t('Region', 'Daerah')}</Label>
                        <Select value={regionId} onValueChange={setRegionId}>
                          <SelectTrigger><SelectValue placeholder={t('Choose region', 'Pilih daerah')} /></SelectTrigger>
                          <SelectContent>
                            {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-end">
                      <Button onClick={saveRole} disabled={saving} className="w-full gap-2">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {t('Confirm', 'Konfirmasi')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
