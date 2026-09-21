'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { DataTeamBuilder } from '@/features/team-builder/types/teamBuilderTypes';
import { useTeamBuilderControllers } from '@/features/team-builder/controllers/teamBuilderControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { RowSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { signedOutState } from '@/shared/lib/browse-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { loginHref } from '@/shared/lib/utils';

// REST.md Bagian 2: "Member bikin tim, sistem generate grade otomatis
// (Junior/Mid/Senior) untuk tiap role" — this page is the "bikin tim" step;
// grading happens on the detail page once members are added.
export default function TeamBuilderList() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLang();
  const { fetchTeamBuilder, storeTeamBuilder } = useTeamBuilderControllers();

  const [filters, setFilters] = useState({ isComposerOpen: false });
  const [form, setForm] = useState({ name: '', description: '' });

  const data = useMemo(() => {
    const getMappedTeam = (team: DataTeamBuilder) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      initial: team.name.charAt(0).toUpperCase(),
      createdAt: new Date(team.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    });

    const list = (fetchTeamBuilder.data ?? []).map(getMappedTeam);
    const isBlocked = loading || !user;

    return {
      data: list,
      isLoading: isBlocked || fetchTeamBuilder.isPending,
      isError: fetchTeamBuilder.isError,
      ...signedOutState(!loading && !user, t, t('teams', 'tim')),
      isEmpty: !isBlocked && !fetchTeamBuilder.isPending && !fetchTeamBuilder.isError && list.length === 0,
      errorTitle: t('Could not load your teams.', 'Gagal memuat tim kamu.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: t("You're not on a team yet.", 'Kamu belum punya tim.'),
      emptySubtitle: t(
        'Create one, add members, and every role gets graded automatically.',
        'Buat satu, tambahkan member, dan tiap role otomatis dapat grade.'
      ),
    };
  }, [fetchTeamBuilder.data, fetchTeamBuilder.isPending, fetchTeamBuilder.isError, loading, user, t, user, loading]);

  const editTeamBuilderComposer = () => {
    setFilters((prev) => ({ ...prev, isComposerOpen: !prev.isComposerOpen }));
  };

  const editTeamBuilderForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const clearTeamBuilderForm = () => {
    setForm({ name: '', description: '' });
    setFilters((prev) => ({ ...prev, isComposerOpen: false }));
  };

  const submitTeamBuilder = async () => {
    if (!user) return;

    if (!form.name.trim()) {
      toast.error(t('Please name the team', 'Beri nama timnya'));
      return;
    }

    try {
      const created = await storeTeamBuilder.mutateAsync({
        owner_id: user.id,
        name: form.name,
        description: form.description,
      });
      if (created) router.push(`/team-builder/${created.id}`);
    } catch {
      toast.error(t('Failed to create team', 'Gagal membuat tim'));
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
  }, [loading, user, router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Product · Build', 'Product · Bangun')}
          tone={toneOf('team-builder')}
          title={t('Team Builder', 'Team Builder')}
          subtitle={t(
            'Assemble a team and every role is graded Junior/Mid/Senior automatically.',
            'Susun tim dan tiap role otomatis dinilai Junior/Mid/Senior.'
          )}
          action={
            <Button onClick={editTeamBuilderComposer} disabled={loading || !user}>
              {filters.isComposerOpen ? t('Close', 'Tutup') : t('New team', 'Tim baru')}
            </Button>
          }
        />

        {filters.isComposerOpen && (
          <Card className="mb-8 border-dashed">
            <CardHeader>
              <CardTitle className="font-display text-xl">{t('Name the team', 'Beri nama tim')}</CardTitle>
              <CardDescription>
                {t('You can add members and roles on the next screen.', 'Member dan role bisa ditambahkan di layar berikutnya.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="team-name">{t('Team name', 'Nama tim')}</Label>
                <Input
                  id="team-name"
                  value={form.name}
                  onChange={(event) => editTeamBuilderForm({ name: event.target.value })}
                  placeholder={t('e.g. Studio Sembilan', 'mis. Studio Sembilan')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description">{t('What is this team for? (optional)', 'Tim ini untuk apa? (opsional)')}</Label>
                <Textarea
                  id="team-description"
                  value={form.description}
                  onChange={(event) => editTeamBuilderForm({ description: event.target.value })}
                  className="min-h-[88px]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button onClick={submitTeamBuilder} disabled={storeTeamBuilder.isPending || !form.name.trim()} className="gap-2">
                  {storeTeamBuilder.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Create team', 'Buat tim')}
                </Button>
                <Button variant="ghost" onClick={clearTeamBuilderForm}>{t('Cancel', 'Batal')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <RowSkeleton count={3} />
          ) : (
            <div className="flex flex-col gap-3">
              {data.data.map((team) => (
                <Link
                  key={team.id}
                  href={`/team-builder/${team.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-semibold ${TONE_CHIP[toneOf('team-builder')]}`}>
                    {team.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:underline">{team.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {team.description || t('No description', 'Tanpa deskripsi')}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{team.createdAt}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
