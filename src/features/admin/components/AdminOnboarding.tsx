'use client';

import { useMemo, useState } from 'react';
import { ClipboardList, Loader2, Search } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useAdminOnboardingControllers } from '@/features/admin/controllers/adminControllers';
import type { DataAdminOnboarding } from '@/features/admin/types/adminTypes';
import {
  ONBOARDING_FIELDS,
  ONBOARDING_GOALS,
  ONBOARDING_JOB_STATUSES,
  ONBOARDING_LEVELS,
  ONBOARDING_REFERRALS,
  type OnboardingOption,
} from '@/features/onboarding/types/onboardingTypes';

interface Props {
  enabled: boolean;
}

export default function AdminOnboarding({ enabled }: Props) {
  const { t } = useLang();
  const { fetchAdminOnboarding } = useAdminOnboardingControllers(enabled);
  const [query, setQuery] = useState('');
  const [doneOnly, setDoneOnly] = useState(true);

  const all = useMemo(() => fetchAdminOnboarding.data ?? [], [fetchAdminOnboarding.data]);
  const done = useMemo(() => all.filter((r) => r.onboarding_completed_at), [all]);

  const label = (options: OnboardingOption[], value: string | null) => {
    const o = options.find((x) => x.value === value);
    return o ? t(o.en, o.id) : value ?? '—';
  };
  const skillNames = (r: DataAdminOnboarding) =>
    r.user_skills.map((s) => s.skills?.name).filter(Boolean) as string[];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (doneOnly ? done : all).filter(
      (r) =>
        !q ||
        (r.full_name ?? '').toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.whatsapp ?? '').includes(q) ||
        (r.location ?? '').toLowerCase().includes(q) ||
        skillNames(r).some((s) => s.toLowerCase().includes(q))
    );
  }, [all, done, doneOnly, query]);

  // How many completed members picked each option; shown as a ranked bar list
  // so the admin sees the community's shape before reading rows.
  const breakdown = (options: OnboardingOption[], pick: (r: DataAdminOnboarding) => string[]) =>
    options
      .map((o) => ({ o, n: done.filter((r) => pick(r).includes(o.value)).length }))
      .sort((a, b) => b.n - a.n);

  const bars = (title: string, options: OnboardingOption[], pick: (r: DataAdminOnboarding) => string[]) => (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {breakdown(options, pick).map(({ o, n }) => (
          <li key={o.value} className="text-sm">
            <div className="flex justify-between gap-2">
              <span>{t(o.en, o.id)}</span>
              <span className="tabular-nums text-muted-foreground">{n}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-foreground"
                style={{ width: `${done.length ? (n / done.length) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const tile = (text: string, value: number | string, hint?: string) => (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs text-muted-foreground">{text}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{t('Onboarding', 'Onboarding')}</CardTitle>
        <CardDescription>
          {t(
            'What members answered in the onboarding popup: field, level, skills, city, phone, status, goals and where they heard about us.',
            'Jawaban member di popup onboarding: bidang, level, skill, kota, no. HP, status, tujuan gabung, dan tahu dari mana.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {fetchAdminOnboarding.isPending ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : all.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">{t('No members yet.', 'Belum ada member.')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {tile(t('Members', 'Member'), all.length)}
              {tile(
                t('Completed', 'Sudah isi'),
                done.length,
                `${Math.round((done.length / all.length) * 100)}%`
              )}
              {tile(t('Not yet', 'Belum isi'), all.length - done.length)}
            </div>

            {done.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bars(t('Field', 'Bidang'), ONBOARDING_FIELDS, (r) => r.fields)}
                {bars(t('Level', 'Level'), ONBOARDING_LEVELS, (r) => (r.experience_level ? [r.experience_level] : []))}
                {bars(t('Status', 'Status'), ONBOARDING_JOB_STATUSES, (r) =>
                  r.current_job_status ? [r.current_job_status] : []
                )}
                {bars(t('Why they joined', 'Tujuan gabung'), ONBOARDING_GOALS, (r) => r.join_goals)}
                {bars(t('Heard about us from', 'Tahu dari'), ONBOARDING_REFERRALS, (r) =>
                  r.referral_source ? [r.referral_source] : []
                )}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('Search name, email, phone, city, skill…', 'Cari nama, email, no. HP, kota, skill…')}
                  className="pl-9"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={doneOnly} onChange={(e) => setDoneOnly(e.target.checked)} />
                {t('Completed only', 'Hanya yang sudah isi')}
              </label>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-border text-left">
                    <th className="sticky left-0 z-10 bg-card py-2.5 pr-4 font-semibold">{t('Member', 'Member')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('Field', 'Bidang')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('Level', 'Level')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('Skills', 'Skill')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('City', 'Kota')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('Phone', 'No. HP')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('Status', 'Status')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('Goals', 'Tujuan')}</th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('Heard from', 'Tahu dari')}</th>
                    <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">{t('Filled', 'Diisi')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.id} className="align-top transition-colors hover:bg-muted/40">
                      <td className="sticky left-0 z-10 bg-card py-2.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            {r.avatar_url && <AvatarImage src={r.avatar_url} alt={r.full_name ?? r.email} />}
                            <AvatarFallback className="bg-primary/15 text-xs text-primary">
                              {(r.full_name ?? r.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.full_name ?? r.email}</p>
                            <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-[8rem] flex-wrap gap-1">
                          {r.fields.length
                            ? r.fields.map((f) => (
                                <Badge key={f} variant="secondary">
                                  {label(ONBOARDING_FIELDS, f)}
                                </Badge>
                              ))
                            : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{label(ONBOARDING_LEVELS, r.experience_level)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        <span className="block min-w-[10rem]">{skillNames(r).join(', ') || '—'}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{r.location || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{r.whatsapp || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {label(ONBOARDING_JOB_STATUSES, r.current_job_status)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block min-w-[10rem]">
                          {r.join_goals.map((g) => label(ONBOARDING_GOALS, g)).join(', ') || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {r.referral_source === 'other' && r.referral_note
                          ? `${label(ONBOARDING_REFERRALS, 'other')}: ${r.referral_note}`
                          : label(ONBOARDING_REFERRALS, r.referral_source)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {r.onboarding_completed_at
                          ? new Date(r.onboarding_completed_at).toLocaleDateString('id-ID')
                          : t('not yet', 'belum')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('No member matches.', 'Tidak ada member yang cocok.')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
