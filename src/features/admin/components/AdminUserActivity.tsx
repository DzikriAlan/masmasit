'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search, Users } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useAdminUserActivityControllers } from '@/features/admin/controllers/adminControllers';
import type { DataAdminUserActivity } from '@/features/admin/types/adminTypes';

/* The 23 counters the RPC returns, in the order an admin scans them: what the
   member produced first, then what they consumed, then profile completeness.
   Keeping the list here rather than in the component body means the table
   header, the per-row cells and the totals row can never drift apart. */
const COLUMNS: { key: keyof DataAdminUserActivity; en: string; id: string }[] = [
  { key: 'jobs_posted', en: 'Jobs', id: 'Lowongan' },
  { key: 'projects_posted', en: 'Projects', id: 'Proyek' },
  { key: 'courses_taught', en: 'Courses', id: 'Kursus' },
  { key: 'events_created', en: 'Events', id: 'Event' },
  { key: 'discussions', en: 'Discussions', id: 'Diskusi' },
  { key: 'builds', en: 'Builds', id: 'Builds' },
  { key: 'articles', en: 'Articles', id: 'Artikel' },
  { key: 'agencies_owned', en: 'Agency', id: 'Agency' },
  { key: 'teams_owned', en: 'Teams', id: 'Tim' },
  { key: 'team_collabs', en: 'Collabs', id: 'Kolab' },
  { key: 'job_applications', en: 'Applied', id: 'Lamar' },
  { key: 'project_bids', en: 'Bids', id: 'Bid' },
  { key: 'enrollments', en: 'Enrolled', id: 'Ikut kursus' },
  { key: 'certificates', en: 'Certs', id: 'Sertifikat' },
  { key: 'event_rsvps', en: 'RSVP', id: 'RSVP' },
  { key: 'bookings_as_talent', en: 'Booked (talent)', id: 'Dibooking' },
  { key: 'bookings_as_client', en: 'Booking (client)', id: 'Booking' },
  { key: 'discussion_comments', en: 'Replies', id: 'Balasan' },
  { key: 'build_likes', en: 'Likes', id: 'Like' },
  { key: 'team_memberships', en: 'In teams', id: 'Anggota tim' },
  { key: 'messages_sent', en: 'Messages', id: 'Pesan' },
  { key: 'experiences', en: 'Experience', id: 'Pengalaman' },
  { key: 'skills', en: 'Skills', id: 'Skill' },
];

const TOTAL_FEATURES = COLUMNS.length;

interface Props {
  enabled: boolean;
}

export default function AdminUserActivity({ enabled }: Props) {
  const { t } = useLang();
  const { fetchAdminUserActivity } = useAdminUserActivityControllers(enabled);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const all = fetchAdminUserActivity.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (r) =>
        (r.full_name ?? '').toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.location ?? '').toLowerCase().includes(q) ||
        r.roles.some((role) => role.toLowerCase().includes(q))
    );
  }, [fetchAdminUserActivity.data, query]);

  const loading = fetchAdminUserActivity.isPending;

  /* "Active" is deliberately a low bar: a member who has touched anything at
     all is a different kind of account from one who signed up and stopped.
     Dormant is the number worth watching, so it gets its own tile. */
  const summary = useMemo(() => {
    const all = fetchAdminUserActivity.data ?? [];
    const active = all.filter((r) => r.total_records > 0);
    const recent = all.filter(
      (r) => Date.now() - new Date(r.last_active_at).getTime() < 14 * 864e5
    );
    return {
      members: all.length,
      active: active.length,
      dormant: all.length - active.length,
      recent: recent.length,
      records: all.reduce((sum, r) => sum + Number(r.total_records), 0),
    };
  }, [fetchAdminUserActivity.data]);

  const since = (iso: string) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
    if (days <= 0) return t('today', 'hari ini');
    if (days === 1) return t('1 day ago', '1 hari lalu');
    if (days < 30) return t(`${days} days ago`, `${days} hari lalu`);
    const months = Math.floor(days / 30);
    return t(`${months} mo ago`, `${months} bln lalu`);
  };

  const tile = (label: string, value: number | string, hint?: string) => (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{t('User Activity', 'Aktivitas User')}</CardTitle>
        <CardDescription>
          {t(
            'Every member, which features they have used, and how much they created in each.',
            'Setiap member, fitur apa saja yang sudah dipakai, dan berapa banyak data yang dibuat di masing-masing.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (fetchAdminUserActivity.data ?? []).length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">{t('No members yet.', 'Belum ada member.')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {tile(t('Members', 'Member'), summary.members)}
              {tile(t('Active', 'Aktif'), summary.active, t('used at least one feature', 'pakai minimal satu fitur'))}
              {tile(t('Active in 14d', 'Aktif 14 hari'), summary.recent)}
              {tile(t('Dormant', 'Tidak aktif'), summary.dormant, t('signed up, never used anything', 'daftar, belum pakai apa pun'))}
              {tile(t('Records created', 'Data dibuat'), summary.records)}
            </div>

            <div className="relative mt-5 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Search name, email, role, city…', 'Cari nama, email, peran, kota…')}
                className="pl-9"
              />
            </div>

            {/* 23 counters do not fit any phone, so the table scrolls sideways
                with the member column pinned rather than wrapping into an
                unreadable stack. */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-border text-left">
                    <th className="sticky left-0 z-10 bg-card py-2.5 pr-4 font-semibold">
                      {t('Member', 'Member')}
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                      {t('Features', 'Fitur')}
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                      {t('Total', 'Total')}
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                      {t('Last active', 'Terakhir aktif')}
                    </th>
                    {COLUMNS.map((c) => (
                      <th
                        key={String(c.key)}
                        className="px-3 py-2.5 text-right font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {t(c.en, c.id)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.user_id} className="transition-colors hover:bg-muted/40">
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
                            <p className="truncate text-xs text-muted-foreground">
                              {r.location ?? '—'} · {r.roles.join(', ') || 'member'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Badge variant={r.features_used === 0 ? 'outline' : 'secondary'} className="tabular-nums">
                          {r.features_used}/{TOTAL_FEATURES}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{r.total_records}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {since(r.last_active_at)}
                      </td>
                      {COLUMNS.map((c) => {
                        const value = Number(r[c.key] ?? 0);
                        return (
                          <td
                            key={String(c.key)}
                            className={
                              'px-3 py-2.5 text-right tabular-nums ' +
                              (value === 0 ? 'text-muted-foreground/40' : '')
                            }
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('No member matches that search.', 'Tidak ada member yang cocok.')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
