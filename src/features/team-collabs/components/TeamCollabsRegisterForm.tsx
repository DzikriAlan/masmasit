'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageDecor } from '@/components/page-decor';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loginHref } from '@/shared/lib/utils';
import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { getTeamBuilder } from '@/features/team-builder/services/teamBuilderServices';
import { useTeamCollabsControllers } from '@/features/team-collabs/controllers/teamCollabsControllers';

// A team must exist before it can register here — REST.md's own flow is
// "bentuk tim dulu, lalu daftar" (Team Builder → Team Collabs).
export default function TeamCollabsRegisterForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const { storeTeamCollabs } = useTeamCollabsControllers();

  const [teamId, setTeamId] = useState(searchParams.get('team') ?? '');
  const [form, setForm] = useState({ focus: '', description: '' });

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
  }, [loading, user, router]);

  const { data: teams = [], isPending: teamsLoading } = useQuery({
    queryKey: ['teamBuilder'],
    queryFn: async () => unwrapApiResponse(await getTeamBuilder()) ?? [],
    enabled: Boolean(user),
  });

  const submitRegistration = async () => {
    if (!user) return;
    if (!teamId || !form.focus.trim() || !form.description.trim()) {
      toast.error(t('Please pick a team and fill in the focus and description', 'Pilih tim dan isi fokus serta deskripsi'));
      return;
    }
    try {
      await storeTeamCollabs.mutateAsync({ team_id: teamId, created_by: user.id, focus: form.focus, description: form.description });
    } catch {
      toast.error(t('Failed to register', 'Gagal mendaftar'));
      return;
    }
    toast.success(t('Registered for Team Collabs', 'Terdaftar di Team Collabs'));
    router.push('/team-collabs');
  };

  if (loading || !user) {
    return (
      <AppShell>
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageDecor>
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
          <Card className="glass">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Users2 className="h-5 w-5" />
              </div>
              <CardTitle className="font-display">{t('Register for Team Collabs', 'Daftar ke Team Collabs')}</CardTitle>
              <CardDescription>{t('Say what your team wants to build together.', 'Ceritakan apa yang ingin tim ini bangun bersama.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('No teams yet — ', 'Belum punya tim — ')}
                  <a href="/team-builder" className="font-medium text-foreground underline underline-offset-4">{t('build one first', 'bentuk dulu')}</a>.
                </p>
              ) : (
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger><SelectValue placeholder={t('Select your team', 'Pilih timmu')} /></SelectTrigger>
                  <SelectContent>
                    {teams.map((tm) => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Input value={form.focus} onChange={(e) => setForm((f) => ({ ...f, focus: e.target.value }))} placeholder={t('Focus (e.g. AI tooling)', 'Fokus (mis. AI tooling)')} />
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('What does the team want to build?', 'Tim ini ingin membangun apa?')}
              />
              <Button onClick={submitRegistration} className="w-full" disabled={storeTeamCollabs.isPending || teams.length === 0}>
                {storeTeamCollabs.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('Register', 'Daftar')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageDecor>
    </AppShell>
  );
}
