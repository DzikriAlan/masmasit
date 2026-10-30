'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase, Code2, GraduationCap, Calendar, Star, Users,
  Settings, ShieldCheck, FileText, MessageCircle,
  Mail, Send, Building2, ClipboardList, Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { useDashboardControllers } from '@/features/dashboard/controllers/dashboardControllers';
import { loginHref } from '@/shared/lib/utils';

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',  // blue
  'hsl(263, 70%, 58%)',  // violet
  'hsl(45, 93%, 58%)',   // amber
  'hsl(160, 60%, 45%)',  // emerald
  'hsl(340, 75%, 55%)',  // pink
  'hsl(25, 95%, 53%)',   // orange
  'hsl(199, 89%, 48%)',  // sky
  'hsl(142, 71%, 45%)',  // green
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(45, 93%, 58%)',
  reviewed: 'hsl(217, 91%, 60%)',
  accepted: 'hsl(160, 60%, 45%)',
  rejected: 'hsl(0, 72%, 51%)',
  interview: 'hsl(263, 70%, 58%)',
  hired: 'hsl(142, 71%, 45%)',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardOverview() {
  const { user, profile, roles, loading, isEmailVerified, resendVerification } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [sendingVerification, setSendingVerification] = useState(false);

  const {
    fetchDashboardStats,
    fetchDashboardMonthlyActivity,
    fetchDashboardSkillDistribution,
    fetchDashboardApplicationStatus,
  } = useDashboardControllers(user?.id);

  const stats = fetchDashboardStats.data ?? { applications: 0, projects: 0, enrollments: 0, rsvps: 0 };
  const monthlyActivity = fetchDashboardMonthlyActivity.data ?? [];
  const skillDistribution = fetchDashboardSkillDistribution.data ?? [];
  const applicationStatus = fetchDashboardApplicationStatus.data ?? [];
  const isAdmin = roles.includes('super_admin') || roles.includes('regional_admin');
  const isCoach = Boolean(profile?.is_coach || profile?.coach_approved === 'approved');
  const isTalent = Boolean(profile?.is_talent);

  const totalActivity = monthlyActivity.reduce(
    (sum, m) => sum + m.applications + m.projects + m.enrollments + m.rsvps, 0
  );
  const recentActivity = monthlyActivity.length >= 2
    ? monthlyActivity[monthlyActivity.length - 1]
    : null;
  const prevActivity = monthlyActivity.length >= 2
    ? monthlyActivity[monthlyActivity.length - 2]
    : null;
  const recentTotal = recentActivity
    ? recentActivity.applications + recentActivity.projects + recentActivity.enrollments + recentActivity.rsvps
    : 0;
  const prevTotal = prevActivity
    ? prevActivity.applications + prevActivity.projects + prevActivity.enrollments + prevActivity.rsvps
    : 0;
  const trendPct = prevTotal > 0 ? Math.round(((recentTotal - prevTotal) / prevTotal) * 100) : 0;
  const trendUp = trendPct >= 0;

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
  }, [user, loading, router]);

  if (loading) {
    return <LoadData minHeight="100vh" response={{ isLoading: true }} />;
  }

  const statCards = [
    { label: t('Job Applications', 'Lamaran Kerja'), value: stats.applications, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: t('My Projects', 'Proyek Saya'), value: stats.projects, icon: Code2, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: t('Enrollments', 'Pendaftaran'), value: stats.enrollments, icon: GraduationCap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: t('Event RSVPs', 'RSVP Event'), value: stats.rsvps, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  const quickLinks = [
    { href: '/app/directory', icon: Users, label: t('Browse Members', 'Jelajahi Member'), desc: t('Connect with IT practitioners', 'Terhubung dengan praktisi IT') },
    { href: '/app/jobs', icon: Briefcase, label: t('Find Jobs', 'Cari Kerja'), desc: t('Browse open positions', 'Jelajahi lowongan') },
    { href: '/app/projects', icon: Code2, label: t('Projects', 'Proyek'), desc: t('Post or bid on projects', 'Pasang atau tawar proyek') },
    { href: '/app/courses', icon: GraduationCap, label: t('Learn', 'Belajar'), desc: t('Enroll in courses', 'Ikuti kursus') },
    { href: '/app/events', icon: Calendar, label: t('Events', 'Event'), desc: t('Join community events', 'Ikuti event komunitas') },
    { href: '/app/talents', icon: Star, label: t('Book Talent', 'Pesan Talent'), desc: t('Hire expert consultants', 'Sewa konsultan ahli') },
    { href: '/app/pesan', icon: MessageCircle, label: t('Messages', 'Pesan'), desc: t('Chat with the community', 'Chat dengan komunitas') },
  ];

  const roleShortcuts = [
    { show: isAdmin, href: '/app/admin', icon: ShieldCheck, label: t('Admin Panel', 'Panel Admin') },
    { show: isCoach, href: '/app/coach', icon: GraduationCap, label: t('Coach Dashboard', 'Dashboard Coach') },
    { show: isTalent, href: '/app/activity?tab=bookings', icon: Star, label: t('Talent Bookings', 'Booking Talent') },
    { show: roles.includes('company'), href: '/app/jobs/applicants', icon: Briefcase, label: t('Job Applicants', 'Pelamar Lowongan') },
    { show: roles.includes('agency_owner'), href: '/app/agency/manage', icon: Building2, label: t('Manage Agency', 'Kelola Agency') },
    { show: roles.includes('client'), href: '/app/activity?tab=requests', icon: ClipboardList, label: t('My Requests', 'Permintaan Saya') },
  ].filter((shortcut) => shortcut.show);

  return (
    <AppShell>
      <div className="page-container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-up">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
            {t('Dashboard', 'Dasbor')}
          </div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            {t('Welcome back', 'Selamat datang')}, {profile?.full_name?.split(' ')[0] ?? t('there', 'teman')}!
          </h1>
          <p className="mt-1 text-muted-foreground">{t('Here\'s what\'s happening in your ecosystem.', 'Inilah yang terjadi di ekosistem Anda.')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((r) => (
              <Badge key={r} variant="secondary" className="capitalize gap-1">
                {r === 'super_admin' && <ShieldCheck className="h-3 w-3" />}
                {r.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Email verification banner */}
        {user && !isEmailVerified && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">{t('Verify your email', 'Verifikasi email Anda')}</p>
                <p className="text-xs text-muted-foreground">{t('Some features like posting jobs and booking are restricted until verified.', 'Beberapa fitur seperti posting lowongan dan booking dibatasi sampai terverifikasi.')}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={sendingVerification}
              onClick={async () => {
                setSendingVerification(true);
                const { error } = await resendVerification();
                setSendingVerification(false);
                if (error) toast.error(t('Failed to send verification', 'Gagal mengirim verifikasi'));
                else toast.success(t('Verification email sent!', 'Email verifikasi dikirim!'));
              }}
              className="gap-2 shrink-0"
            >
              <Send className="h-3.5 w-3.5" /> {t('Resend', 'Kirim Ulang')}
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => (
            <Card key={s.label} className={`glass glass-hover stagger-${i + 1} overflow-hidden`}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          {/* Activity Area Chart */}
          <Card className="glass lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-base">
                    {t('Activity Overview', 'Ringkasan Aktivitas')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('Your activity in the last 6 months', 'Aktivitas Anda dalam 6 bulan terakhir')}
                  </CardDescription>
                </div>
                {monthlyActivity.length >= 2 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {trendUp ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-400" />
                    )}
                    <span className={trendUp ? 'text-emerald-400' : 'text-red-400'}>
                      {trendUp ? '+' : ''}{trendPct}%
                    </span>
                    <span className="text-muted-foreground">
                      {t('vs last month', 'vs bulan lalu')}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[260px] w-full">
                {monthlyActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradProjects" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradEnrollments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[2]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRsvps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[3]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[3]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="applications"
                        name={t('Applications', 'Lamaran')}
                        stroke={CHART_COLORS[0]}
                        fill="url(#gradApps)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="projects"
                        name={t('Projects', 'Proyek')}
                        stroke={CHART_COLORS[1]}
                        fill="url(#gradProjects)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="enrollments"
                        name={t('Enrollments', 'Pendaftaran')}
                        stroke={CHART_COLORS[2]}
                        fill="url(#gradEnrollments)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="rsvps"
                        name="RSVPs"
                        stroke={CHART_COLORS[3]}
                        fill="url(#gradRsvps)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {fetchDashboardMonthlyActivity.isLoading
                      ? t('Loading chart...', 'Memuat grafik...')
                      : t('No activity data yet', 'Belum ada data aktivitas')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Status Donut */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                {t('Application Status', 'Status Lamaran')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('Your job applications by status', 'Lamaran kerja berdasarkan status')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px] w-full">
                {applicationStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {applicationStatus.map((entry, i) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0];
                          return (
                            <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.payload.fill }} />
                                <span className="capitalize">{String(d.name)}</span>
                                <span className="ml-1 font-medium tabular-nums">{String(d.value)}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {fetchDashboardApplicationStatus.isLoading
                      ? t('Loading...', 'Memuat...')
                      : t('No applications yet', 'Belum ada lamaran')}
                  </div>
                )}
              </div>
              {applicationStatus.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {applicationStatus.map((entry, i) => (
                    <div key={entry.status} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="capitalize text-muted-foreground">{entry.status}</span>
                      <span className="font-medium tabular-nums">{entry.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skills & Activity Bar Chart Row */}
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          {/* Skills Distribution */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                {t('Your Skills', 'Skill Anda')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('Registered skills in your profile', 'Skill yang terdaftar di profil Anda')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[220px] w-full">
                {skillDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        width={90}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0];
                          return (
                            <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                              <span className="font-medium">{String(d.payload.name)}</span>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {skillDistribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    {fetchDashboardSkillDistribution.isLoading
                      ? t('Loading...', 'Memuat...')
                      : (
                        <>
                          <p>{t('No skills added yet', 'Belum ada skill ditambahkan')}</p>
                          <Link href="/app/profile">
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Settings className="h-3.5 w-3.5" />
                              {t('Add skills', 'Tambah skill')}
                            </Button>
                          </Link>
                        </>
                      )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Bar Chart */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-base">
                    {t('Monthly Breakdown', 'Rincian Bulanan')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('Total activities per month', 'Total aktivitas per bulan')}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums">{totalActivity}</div>
                  <div className="text-[10px] text-muted-foreground">{t('total', 'total')}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[220px] w-full">
                {monthlyActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyActivity.map((m) => ({
                        ...m,
                        total: m.applications + m.projects + m.enrollments + m.rsvps,
                      }))}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="applications" name={t('Applications', 'Lamaran')} stackId="a" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="projects" name={t('Projects', 'Proyek')} stackId="a" fill={CHART_COLORS[1]} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="enrollments" name={t('Enrollments', 'Pendaftaran')} stackId="a" fill={CHART_COLORS[2]} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="rsvps" name="RSVPs" stackId="a" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {fetchDashboardMonthlyActivity.isLoading
                      ? t('Loading chart...', 'Memuat grafik...')
                      : t('No activity data yet', 'Belum ada data aktivitas')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <h2 className="mb-4 font-display text-xl font-semibold">{t('Quick Access', 'Akses Cepat')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, i) => (
            <Link key={link.href} href={link.href}>
              <Card className={`group glass glass-hover h-full stagger-${(i % 6) + 1}`}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{link.label}</div>
                    <div className="text-sm text-muted-foreground">{link.desc}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Admin & Profile links */}
        <div className="mt-8 flex flex-wrap gap-3">
          {roleShortcuts.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href}>
              <Button variant="outline" className="gap-2">
                <shortcut.icon className="h-4 w-4" /> {shortcut.label}
              </Button>
            </Link>
          ))}
          <Link href="/app/activity">
            <Button variant="outline" className="gap-2">
              <Activity className="h-4 w-4" /> {t('My Activity', 'Aktivitas Saya')}
            </Button>
          </Link>
          <Link href="/app/profile">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" /> {t('Edit Profile', 'Edit Profil')}
            </Button>
          </Link>
          <Link href="/app/case-studies">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" /> {t('Case Studies', 'Studi Kasus')}
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
