'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useTeamBuilderDetailControllers, useTeamBuilderMembersSearchControllers } from '@/features/team-builder/controllers/teamBuilderControllers';

const gradeTone: Record<string, string> = {
  senior: 'border-eco-violet/40 bg-eco-violet/10 text-eco-violet',
  mid: 'border-eco-blue/40 bg-eco-blue/10 text-eco-blue',
  junior: 'border-border bg-muted text-muted-foreground',
};

export default function TeamBuilderDetail() {
  const params = useParams();
  const teamId = String(params.id ?? '');
  const { user } = useAuth();
  const { t } = useLang();
  const {
    fetchTeamBuilderDetail,
    fetchTeamBuilderRoster,
    storeTeamBuilderMembers,
    removeTeamBuilderMembers,
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
    toast.success(t('Member added', 'Member ditambahkan'));
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
                {roster.map((r) => {
                  const initial = (r.full_name ?? '?').charAt(0).toUpperCase();
                  return (
                    <div key={r.member_id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {r.avatar_url && <AvatarImage src={r.avatar_url} />}
                          <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.full_name ?? t('Member', 'Member')}</p>
                          <p className="text-xs text-muted-foreground">{r.role_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`capitalize ${gradeTone[r.grade]}`}>{r.grade}</Badge>
                        {isOwner && (
                          <button onClick={() => removeTeamBuilderMembers.mutate(r.member_id)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </LoadData>
          </section>

          {isOwner && (
            <section className="mt-8 rounded-xl border border-border p-5">
              <p className="eyebrow text-muted-foreground">{t('Add a member', 'Tambah member')}</p>
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
                  {t('Add', 'Tambah')}
                </Button>
              </div>
            </section>
          )}

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row">
            <Link href={`/team-collabs/register?team=${team.id}`} className="w-full sm:w-auto">
              <Button variant="outline" className="h-11 w-full rounded-full px-6 text-base font-semibold sm:w-auto">
                {t('Register for Team Collabs', 'Daftar ke Team Collabs')}
              </Button>
            </Link>
            <Link href="/projects" className="w-full sm:w-auto">
              <Button variant="outline" className="h-11 w-full rounded-full px-6 text-base font-semibold sm:w-auto">
                {t('Browse client projects', 'Jelajahi proyek klien')}
              </Button>
            </Link>
          </div>
          </>
          )}
        </LoadData>
    </AppShell>
  );
}
