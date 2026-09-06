'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  profiles?: { created_at: string }[];
  roleData?: { role: string }[];
  jobsData?: { created_at: string }[];
  appsData?: { created_at: string }[];
  bookingsData?: { amount: number; created_at: string; payment_status: string }[];
  agencyData?: { budget: number; dp_amount: number | null; dp_payment_status: string; final_payment_status: string; created_at: string }[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

function getWeekKey(date: string) {
  const d = new Date(date);
  const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `W${week}`;
}

function getMonthKey(date: string) {
  const d = new Date(date);
  return d.toLocaleString('en-US', { month: 'short' });
}

export function AnalyticsCharts({ data, t }: { data: AnalyticsData | null; t: (en: string, id: string) => string }) {
  const charts = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

    const membersPerWeek: Record<string, number> = {};
    (data.profiles ?? []).forEach((p) => {
      const d = new Date(p.created_at);
      if (d >= twelveWeeksAgo) {
        const key = getWeekKey(p.created_at);
        membersPerWeek[key] = (membersPerWeek[key] ?? 0) + 1;
      }
    });
    const membersData = Object.entries(membersPerWeek).map(([week, count]) => ({ week, members: count }));

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const jobsPerMonth: Record<string, number> = {};
    const appsPerMonth: Record<string, number> = {};
    (data.jobsData ?? []).forEach((j) => {
      const d = new Date(j.created_at);
      if (d >= sixMonthsAgo) {
        const key = getMonthKey(j.created_at);
        jobsPerMonth[key] = (jobsPerMonth[key] ?? 0) + 1;
      }
    });
    (data.appsData ?? []).forEach((a) => {
      const d = new Date(a.created_at);
      if (d >= sixMonthsAgo) {
        const key = getMonthKey(a.created_at);
        appsPerMonth[key] = (appsPerMonth[key] ?? 0) + 1;
      }
    });
    const monthKeys = Object.keys({ ...jobsPerMonth, ...appsPerMonth });
    const jobsAppsData = monthKeys.map((month) => ({ month, jobs: jobsPerMonth[month] ?? 0, applications: appsPerMonth[month] ?? 0 }));

    const revenuePerMonth: Record<string, number> = {};
    (data.bookingsData ?? []).forEach((b) => {
      if (b.payment_status === 'paid') {
        const d = new Date(b.created_at);
        if (d >= sixMonthsAgo) {
          const key = getMonthKey(b.created_at);
          revenuePerMonth[key] = (revenuePerMonth[key] ?? 0) + (b.amount ?? 0);
        }
      }
    });
    (data.agencyData ?? []).forEach((a) => {
      if (a.dp_payment_status === 'paid' || a.final_payment_status === 'paid') {
        const d = new Date(a.created_at);
        if (d >= sixMonthsAgo) {
          const key = getMonthKey(a.created_at);
          revenuePerMonth[key] = (revenuePerMonth[key] ?? 0) + (a.dp_amount ?? a.budget ?? 0);
        }
      }
    });
    const revenueData = Object.entries(revenuePerMonth).map(([month, amount]) => ({ month, revenue: amount }));

    const roleCounts: Record<string, number> = {};
    (data.roleData ?? []).forEach((r) => {
      roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
    });
    const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

    return { membersData, jobsAppsData, revenueData, roleData };
  }, [data]);

  if (!charts) return <Card className="glass"><CardContent className="p-8 text-center text-muted-foreground">Loading analytics...</CardContent></Card>;

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {t('New Members per Week', 'Member Baru per Minggu')}</CardTitle></CardHeader>
        <CardContent>
          {charts.membersData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('No data yet.', 'Belum ada data.')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={charts.membersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="members" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> {t('Jobs vs Applications per Month', 'Lowongan vs Lamaran per Bulan')}</CardTitle></CardHeader>
        <CardContent>
          {charts.jobsAppsData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('No data yet.', 'Belum ada data.')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.jobsAppsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applications" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> {t('Revenue per Month', 'Pendapatan per Bulan')}</CardTitle></CardHeader>
          <CardContent>
            {charts.revenueData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('No paid revenue yet.', 'Belum ada pendapatan.')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> {t('Member Role Distribution', 'Distribusi Role Member')}</CardTitle></CardHeader>
          <CardContent>
            {charts.roleData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('No data yet.', 'Belum ada data.')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={charts.roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.name}: ${entry.value}`}>
                    {charts.roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
