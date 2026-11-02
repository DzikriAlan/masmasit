'use client';

import { ExternalLink, Gauge, Loader2, RefreshCw } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminPlatformUsageControllers } from '@/features/admin/controllers/adminControllers';
import type { DataAdminPlatformUsage } from '@/features/admin/types/adminTypes';
import { cn } from '@/shared/lib/utils';

const MB = 1024 * 1024;
const GB = 1024 * MB;

const SUPABASE_PROJECT = 'https://supabase.com/dashboard/project/eafddsdotkjusjhacnmq';
const SUPABASE_USAGE = 'https://supabase.com/dashboard/org/mktfdrtkommapsfsmmuc/usage';
const RESEND_USAGE = 'https://resend.com/settings/usage';

const formatBytes = (bytes: number) => (bytes >= GB ? `${(bytes / GB).toFixed(2)} GB` : `${(bytes / MB).toFixed(1)} MB`);
const formatCount = (count: number) => count.toLocaleString('id-ID');

type LimitMeterProps = {
  label: string;
  hint: string;
  used: number | null;
  limit: number;
  format: (value: number) => string;
  estimate?: boolean;
};

function LimitMeter({ label, hint, used, limit, format, estimate }: Readonly<LimitMeterProps>) {
  const { t } = useLang();
  const percent = used === null ? null : (used / limit) * 100;
  const level = percent === null ? 'none' : percent >= 90 ? 'danger' : percent >= 70 ? 'warning' : 'ok';

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {label}
          {estimate && <Badge variant="outline">{t('Estimate', 'Perkiraan')}</Badge>}
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {used === null ? '—' : format(used)} / {format(limit)}
          {percent !== null && <span className="ml-2 font-medium text-foreground">{Math.floor(percent)}%</span>}
        </p>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        {percent !== null && (
          <div
            className={cn(
              'h-1.5 rounded-full',
              level === 'danger' && 'bg-destructive',
              level === 'warning' && 'bg-warning',
              level === 'ok' && 'bg-success'
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function SourceLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 py-1.5 text-xs font-medium text-primary hover:underline">
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

const pick = (usage: DataAdminPlatformUsage | null | undefined, key: keyof DataAdminPlatformUsage) => usage?.[key] ?? null;

export default function AdminPlatformLimits({ enabled }: Readonly<{ enabled: boolean }>) {
  const { t } = useLang();
  const { fetchAdminPlatformUsage } = useAdminPlatformUsageControllers(enabled);
  const { data: usage, isPending, isError, isFetching, refetch, dataUpdatedAt } = fetchAdminPlatformUsage;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" /> {t('Service Limits', 'Batas Layanan')}
          </CardTitle>
          <CardDescription className="mt-1.5">
            {t(
              'Free-plan usage for Supabase and Resend. Limits are the plan values written in this page, so check the provider if a plan changes.',
              'Pemakaian paket Free Supabase dan Resend. Batasnya adalah nilai paket yang ditulis di halaman ini, jadi cek penyedianya kalau paket berubah.'
            )}
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" className="gap-2" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          {t('Refresh', 'Muat ulang')}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {isPending && enabled && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <p className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
            {t('Could not load usage. The numbers below are unavailable.', 'Pemakaian gagal dimuat. Angka di bawah tidak tersedia.')}
          </p>
        )}

        {!isPending && !isError && !usage && (
          <p className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm [overflow-wrap:anywhere]">
            {t(
              'Usage numbers need one setup step: run supabase/run/09_ADMIN_PLATFORM_USAGE.sql in the Supabase SQL Editor.',
              'Angka pemakaian butuh satu langkah: jalankan supabase/run/09_ADMIN_PLATFORM_USAGE.sql di Supabase SQL Editor.'
            )}
          </p>
        )}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Resend · {t('email', 'email')}</h3>
            <SourceLink href={RESEND_USAGE}>{t('Exact usage in Resend', 'Angka pasti di Resend')}</SourceLink>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <LimitMeter
              label={t('Emails today', 'Email hari ini')}
              hint={t('Resets at 00:00 UTC (07:00 WIB).', 'Reset pukul 00.00 UTC (07.00 WIB).')}
              used={pick(usage, 'emails_today')}
              limit={100}
              format={formatCount}
              estimate
            />
            <LimitMeter
              label={t('Emails this month', 'Email bulan ini')}
              hint={t('Sign-up and password emails only. Repeats to one person count once.', 'Hanya email daftar dan password. Kiriman berulang ke orang yang sama terhitung sekali.')}
              used={pick(usage, 'emails_this_month')}
              limit={3000}
              format={formatCount}
              estimate
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Supabase</h3>
            <div className="flex flex-wrap gap-3">
              <SourceLink href={SUPABASE_USAGE}>{t('Exact usage', 'Angka pasti')}</SourceLink>
              <SourceLink href={`${SUPABASE_PROJECT}/auth/rate-limits`}>{t('Rate limits', 'Rate limit')}</SourceLink>
              <SourceLink href={`${SUPABASE_PROJECT}/logs/auth-logs`}>{t('Auth logs', 'Log Auth')}</SourceLink>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <LimitMeter
              label={t('Auth emails, last hour', 'Email Auth, 1 jam terakhir')}
              hint={t('Limit as set in Supabase Rate Limits. Update this page if you change it.', 'Batas sesuai pengaturan Rate Limits Supabase. Ubah di halaman ini kalau pengaturannya diganti.')}
              used={pick(usage, 'emails_last_hour')}
              limit={30}
              format={formatCount}
              estimate
            />
            <LimitMeter
              label={t('Database size', 'Ukuran database')}
              hint={t('Free-plan limit: 500 MB.', 'Batas paket Free: 500 MB.')}
              used={pick(usage, 'database_bytes')}
              limit={500 * MB}
              format={formatBytes}
            />
            <LimitMeter
              label={t('File storage', 'Penyimpanan file')}
              hint={t('Free-plan limit: 1 GB.', 'Batas paket Free: 1 GB.')}
              used={pick(usage, 'storage_bytes')}
              limit={GB}
              format={formatBytes}
            />
            <LimitMeter
              label={t('Monthly active users', 'User aktif bulan ini')}
              hint={t('People who signed in this month, based on their latest sign-in.', 'Orang yang login bulan ini, dari waktu login terakhirnya.')}
              used={pick(usage, 'monthly_active_users')}
              limit={50000}
              format={formatCount}
              estimate
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              'Not shown here: egress (5 GB) and Edge Function calls (500,000), which are only in Supabase Usage. Free projects are paused after 1 week of inactivity.',
              'Tidak tampil di sini: egress (5 GB) dan panggilan Edge Function (500.000), yang hanya ada di Supabase Usage. Project Free dijeda setelah 1 minggu tidak aktif.'
            )}
          </p>
        </section>

        {usage && dataUpdatedAt > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('Updated', 'Diperbarui')} {new Date(dataUpdatedAt).toLocaleTimeString('id-ID')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
