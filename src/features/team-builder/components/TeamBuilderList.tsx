'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loginHref } from '@/shared/lib/utils';

import { useTeamBuilderControllers } from '@/features/team-builder/controllers/teamBuilderControllers';

// REST.md Bagian 2: "Member bikin tim, sistem generate grade otomatis
// (Junior/Mid/Senior) untuk tiap role" — this page is the "bikin tim" step;
// grading happens on the detail page once members are added.
export default function TeamBuilderList() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLang();
  const { fetchTeamBuilder, storeTeamBuilder } = useTeamBuilderControllers();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
  }, [loading, user, router]);

  const teams = fetchTeamBuilder.data ?? [];
  const listLoading = fetchTeamBuilder.isPending;

  const createTeam = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error(t('Please name the team', 'Beri nama timnya'));
      return;
    }
    try {
      const created = await storeTeamBuilder.mutateAsync({ owner_id: user.id, name: form.name, description: form.description });
      if (created) router.push(`/team-builder/${created.id}`);
    } catch {
      toast.error(t('Failed to create team', 'Gagal membuat tim'));
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          tone={toneOf('team-builder')}
          title={t('Team Builder', 'Team Builder')}
          subtitle={t('Assemble a team, roles graded automatically.', 'Susun tim, grade tiap role otomatis.')}
          action={
            <Button onClick={() => setOpen((v) => !v)} disabled={loading || !user}>{t('New team', 'Tim baru')}</Button>
          }
        />

        {open && (
          <Card className="glass mb-6">
            <CardHeader><CardTitle>{t('Name the team', 'Beri nama tim')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('Team name', 'Nama tim')} />
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder={t('What is this team for? (optional)', 'Tim ini untuk apa? (opsional)')} />
              <Button onClick={createTeam} disabled={storeTeamBuilder.isPending} className="gap-2">
                {storeTeamBuilder.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Create', 'Buat')}
              </Button>
            </CardContent>
          </Card>
        )}

        <LoadData
          hideIcon
          response={{
            isLoading: loading || !user || listLoading,
            isEmpty: teams.length === 0,
            emptyTitle: t("You're not on a team yet.", 'Kamu belum punya tim.'),
          }}
        >
          <div className="divide-y divide-border border-y border-border">
            {teams.map((team) => (
              <Link key={team.id} href={`/team-builder/${team.id}`} className="flex items-center justify-between py-4 transition-colors hover:bg-muted/40">
                <div>
                  <p className="font-medium text-foreground">{team.name}</p>
                  {team.description && <p className="mt-0.5 text-sm text-muted-foreground">{team.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </LoadData>
      </div>
    </AppShell>
  );
}
