'use client';

import { useMemo } from 'react';
import { Loader2, Megaphone } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAdminOnboardingControllers } from '@/features/admin/controllers/adminControllers';
import { ONBOARDING_REFERRALS } from '@/features/onboarding/types/onboardingTypes';

interface Props {
  enabled: boolean;
}

const RECENT_DAYS = 30;

/**
 * Dashboard monitor: where members heard about MasmasIT. Shares the
 * adminOnboarding query with the Onboarding tab, so it costs no extra fetch.
 * "Recent" counts answers submitted in the last 30 days, which shows whether
 * a channel is still bringing people in rather than only its all-time total.
 */
export default function AdminReferralSources({ enabled }: Props) {
  const { t } = useLang();
  const { fetchAdminOnboarding } = useAdminOnboardingControllers(enabled);

  const { rows, answered, recentTotal, members } = useMemo(() => {
    const all = fetchAdminOnboarding.data ?? [];
    const withSource = all.filter((r) => r.referral_source);
    const since = Date.now() - RECENT_DAYS * 864e5;
    const isRecent = (iso: string | null) => !!iso && new Date(iso).getTime() >= since;
    return {
      members: all.length,
      answered: withSource.length,
      recentTotal: withSource.filter((r) => isRecent(r.onboarding_completed_at)).length,
      rows: ONBOARDING_REFERRALS.map((o) => {
        const picked = withSource.filter((r) => r.referral_source === o.value);
        return { o, n: picked.length, recent: picked.filter((r) => isRecent(r.onboarding_completed_at)).length };
      }).sort((a, b) => b.n - a.n),
    };
  }, [fetchAdminOnboarding.data]);

  const top = rows[0];

  return (
    <Card className="glass mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-5 w-5" />
          {t('Where members hear about us', 'Member tahu MasmasIT dari mana')}
        </CardTitle>
        <CardDescription>
          {answered > 0
            ? t(
                `${answered} of ${members} members answered · ${recentTotal} in the last ${RECENT_DAYS} days` +
                  (top?.n ? ` · top channel: ${top.o.en}` : ''),
                `${answered} dari ${members} member menjawab · ${recentTotal} dalam ${RECENT_DAYS} hari terakhir` +
                  (top?.n ? ` · kanal teratas: ${top.o.id}` : '')
              )
            : t('From the onboarding popup.', 'Dari popup onboarding.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fetchAdminOnboarding.isPending ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : fetchAdminOnboarding.isError ? (
          <p className="text-sm text-muted-foreground">
            {t('Could not load. Has migration 025 been applied?', 'Gagal memuat. Migration 025 sudah dijalankan?')}
          </p>
        ) : answered === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('No answers yet.', 'Belum ada jawaban.')}
          </p>
        ) : (
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ o, n, recent }) => (
              <li key={o.value} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span>{t(o.en, o.id)}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{n}</span>
                    <span className="text-muted-foreground"> · {Math.round((n / answered) * 100)}%</span>
                    {recent > 0 && <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400">+{recent}</span>}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-foreground" style={{ width: `${(n / answered) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
