'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useTeamBuilderDetailControllers, useTeamBuilderMembersSearchControllers } from '@/features/team-builder/controllers/teamBuilderControllers';
import TeamBuilderRosterRow from '@/features/team-builder/components/TeamBuilderRosterRow';
import TeamBuilderSettings from '@/features/team-builder/components/TeamBuilderSettings';

export default function TeamBuilderDetail() {
  const params = useParams();
  const teamId = String(params.id ?? '');
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const {
    fetchTeamBuilderDetail,
    fetchTeamBuilderRoster,
    storeTeamBuilderMembers,
    removeTeamBuilderMembers,
    modifyTeamBuilder,
    removeTeamBuilder,
    modifyTeamBuilderMembers,
    modifyTeamBuilderMembersAccept,
  } = useTeamBuilderDetailControllers(teamId);

  const [search, setSearch] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [pickedUserId, setPickedUserId] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState('');

  const { fetchTeamBuilderMembersSearch } = useTeamBuilderMembersSearchControllers(search);

  const team = fetchTeamBuilderDetail.data;
  const roster = fetchTeamBuilderRoster.data ?? [];
  const results = (fetchTeamBuilderMembersSearch.data ?? []).filter((p) => !roster.some((r) => r.user_id === p.id));
  const loading = fetchTeamBuilderDetail.isPending;
  const isOwner = team?.owner_id === user?.id;
  // The caller's own roster row, if any — drives the invite banner and
  // "Leave team" (the owner manages rather than leaves).
  const ownMembership = roster.find((r) => r.user_id === user?.id) ?? null;
  const isInvitee = !isOwner && ownMembership?.status === 'invited';
  const canLeave = !isOwner && ownMembership?.status === 'active';

  const addMember = async () => {
    if (!pickedUserId || !roleTitle.trim()) {
      toast.error(t('Pick a member and a role', 'Pilih member dan role-nya'));
      return;
    }
    try {
      await storeTeamBuilderMembers.mutateAsync({ team_id: teamId, user_id: pickedUserId, role_title: roleTitle });
    } catch {
      toast.error(t('Failed to add member', 'Gagal menambah member'));
      return;
    }
    setSearch(''); setRoleTitle(''); setPickedUserId(null); setPickedName('');
    toast.success(t('Invitation sent', 'Undangan terkirim'));
  };

  const editTeamBuilder = async (form: { name: string; description: string }) => {
    if (!form.name.trim()) {
      toast.error(t('Please name the team', 'Beri nama timnya'));
      return false;
    }
    try {
      await modifyTeamBuilder.mutateAsync({ id: teamId, name: form.name.trim(), description: form.description.trim() });
    } catch {
      toast.error(t('Failed to save team', 'Gagal menyimpan tim'));
      return false;
    }
    toast.success(t('Team updated', 'Tim diperbarui'));
    return true;
  };

  const clearTeamBuilder = async () => {
    try {
      await removeTeamBuilder.mutateAsync();
    } catch {
      toast.error(t('Failed to delete team', 'Gagal menghapus tim'));
      return;
    }
    toast.success(t('Team deleted', 'Tim dihapus'));
    router.push('/team-builder');
  };

  const editTeamBuilderMembers = async (memberId: string, role: string) => {
    try {
      await modifyTeamBuilderMembers.mutateAsync({ member_id: memberId, role_title: role });
    } catch {
      toast.error(t('Failed to update role', 'Gagal mengubah role'));
      return false;
    }
    toast.success(t('Role updated', 'Role diperbarui'));
    return true;
  };

  const clearTeamBuilderMembers = (memberId: string) => {
    removeTeamBuilderMembers.mutate(memberId);
  };

  const submitTeamBuilderInvite = async () => {
    if (!ownMembership) return;
    try {
      await modifyTeamBuilderMembersAccept.mutateAsync(ownMembership.member_id);
    } catch {
      toast.error(t('Failed to accept invitation', 'Gagal menerima undangan'));
      return;
    }
    toast.success(t('You joined the team', 'Kamu bergabung ke tim'));
  };

  const clearTeamBuilderMembership = async (isDecline: boolean) => {
    if (!ownMembership) return;
    try {
      await removeTeamBuilderMembers.mutateAsync(ownMembership.member_id);
    } catch {
      toast.error(t('Something went wrong', 'Terjadi kesalahan'));
      return;
    }
    toast.success(isDecline ? t('Invitation declined', 'Undangan ditolak') : t('You left the team', 'Kamu keluar dari tim'));
    router.push('/team-builder');
  };

  return (
    <AppShell>
              <LoadData
          minHeight="60vh"
          className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8"
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: !team,
            emptyTitle: t("Team not found, or you're not on it.", 'Tim tidak ditemukan, atau kamu bukan anggotanya.'),
          }}
        >
          {/* Guarded here too, not just by LoadData above — this component's
              own render pass constructs these children regardless of what
              LoadData ends up showing, so `team.name` would throw on the
              very first render while it is still loading. */}
          {team && (
          <>
          <p className="eyebrow text-muted-foreground">Team Builder</p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{team.name}</h1>
          {team.description && <p className="mt-3 max-w-xl text-base text-muted-foreground text-pretty">{team.description}</p>}

          {isOwner && (
            <TeamBuilderSettings
              team={team}
              isSaving={modifyTeamBuilder.isPending}
              isDeleting={removeTeamBuilder.isPending}
              onEditTeamBuilder={editTeamBuilder}
              onClearTeamBuilder={clearTeamBuilder}
            />
          )}

          {isInvitee && (
            <section className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <p className="text-sm font-medium text-foreground">
                {t(`You're invited to join as ${ownMembership?.role_title}.`, `Kamu diundang bergabung sebagai ${ownMembership?.role_title}.`)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={submitTeamBuilderInvite} disabled={modifyTeamBuilderMembersAccept.isPending} className="gap-2">
                  {modifyTeamBuilderMembersAccept.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Accept', 'Terima')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => clearTeamBuilderMembership(true)} disabled={removeTeamBuilderMembers.isPending}>
                  {t('Decline', 'Tolak')}
                </Button>
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="eyebrow text-muted-foreground">{t('Roster', 'Susunan Tim')}</h2>
            <LoadData
              className="mt-4"
              response={{
                isLoading: fetchTeamBuilderRoster.isPending,
                isEmpty: roster.length === 0,
                emptyTitle: t('No members yet.', 'Belum ada member.'),
              }}
            >
              <div className="divide-y divide-border border-y border-border">
                {roster.map((r) => (
                  <TeamBuilderRosterRow
                    key={r.member_id}
                    member={r}
                    isOwner={isOwner}
                    onEditTeamBuilderMembers={editTeamBuilderMembers}
                    onClearTeamBuilderMembers={clearTeamBuilderMembers}
                  />
                ))}
              </div>
            </LoadData>
          </section>

          {isOwner && (
            <section className="mt-8 rounded-xl border border-border p-5">
              <p className="eyebrow text-muted-foreground">{t('Invite a member', 'Undang member')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('They get a notification and appear as "Invited" until they accept.', 'Mereka mendapat notifikasi dan tampil "Diundang" sampai menerima.')}
              </p>
              <div className="mt-3 space-y-3">
                <div className="relative">
                  <Input
                    value={pickedUserId ? pickedName : search}
                    onChange={(e) => { setSearch(e.target.value); setPickedUserId(null); }}
                    placeholder={t('Search by name...', 'Cari nama...')}
                  />
                  {!pickedUserId && search.length >= 2 && results.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-white shadow-lg">
                      {results.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setPickedUserId(p.id); setPickedName(p.full_name ?? ''); }}
                          className="flex w-full items-center gap-2 p-2.5 text-left text-sm hover:bg-muted/50"
                        >
                          {p.full_name ?? t('Unnamed', 'Tanpa nama')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder={t('Role (e.g. Backend, Design)', 'Role (mis. Backend, Desain)')} />
                <Button onClick={addMember} disabled={storeTeamBuilderMembers.isPending} className="gap-2">
                  {storeTeamBuilderMembers.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Send invite', 'Kirim undangan')}
                </Button>
              </div>
            </section>
          )}

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row">
            {isOwner && (
              <Link href={`/team-collabs/register?team=${team.id}`} className="w-full sm:w-auto">
                <Button variant="outline" className="h-11 w-full rounded-full px-6 text-base font-semibold sm:w-auto">
                  {t('Register for Team Collabs', 'Daftar ke Team Collabs')}
                </Button>
              </Link>
            )}
            <Link href="/projects" className="w-full sm:w-auto">
              <Button variant="outline" className="h-11 w-full rounded-full px-6 text-base font-semibold sm:w-auto">
                {t('Browse client projects', 'Jelajahi proyek klien')}
              </Button>
            </Link>
            {canLeave && (
              <Button
                variant="ghost"
                onClick={() => clearTeamBuilderMembership(false)}
                disabled={removeTeamBuilderMembers.isPending}
                className="h-11 w-full rounded-full px-6 text-base font-semibold text-destructive hover:text-destructive sm:ml-auto sm:w-auto"
              >
                {t('Leave team', 'Keluar dari tim')}
              </Button>
            )}
          </div>
          </>
          )}
        </LoadData>
    </AppShell>
  );
}
