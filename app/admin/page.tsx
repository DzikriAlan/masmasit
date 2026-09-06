'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Check, X, Users, Briefcase, Code2, GraduationCap, Star, TrendingUp, Settings, Calendar, FolderKanban, Flag, Trash2, Ban, CreditCard, BarChart3, ExternalLink, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AnalyticsCharts } from '@/components/analytics-charts';

export default function AdminPage() {
  const { user, roles, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState({ members: 0, jobs: 0, projects: 0, courses: 0, bookings: 0, agencyProjects: 0 });
  const [savingSettings, setSavingSettings] = useState(false);
  const [agencyProjects, setAgencyProjects] = useState<any[]>([]);
  const [moderationItems, setModerationItems] = useState<{ type: string; id: string; title: string; meta: string }[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || (!roles.includes('super_admin') && !roles.includes('regional_admin'))) {
        router.push('/dashboard');
      } else {
        setAuthChecked(true);
      }
    }
  }, [user, roles, loading, router]);

  useEffect(() => {
    if (authChecked) {
      loadAll();
    }
  }, [authChecked]);

  const loadAll = async () => {
    const [{ data: comps }, { data: coas }, { data: set }, { count: members }, { count: jobs }, { count: projects }, { count: courses }, { count: bookings }, { count: agencyProjs }] = await Promise.all([
      supabase.from('companies').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, bio, is_coach, coach_approved, is_talent, talent_approved').or('is_coach.eq.true,is_talent.eq.true').order('created_at', { ascending: false }),
      supabase.from('app_settings').select('*').maybeSingle(),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('agency_projects').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);
    setCompanies(comps ?? []);
    setCoaches(coas ?? []);
    setSettings(set);

    const { data: agProjs } = await supabase.from('agency_projects').select('*, agency_services(category, title)').order('created_at', { ascending: false });
    setAgencyProjects(agProjs ?? []);

    const [modJobs, modProjects, modCourses, modEvents] = await Promise.all([
      supabase.from('jobs').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('projects').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('courses').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('events').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
    ]);
    const items: { type: string; id: string; title: string; meta: string }[] = [];
    (modJobs.data ?? []).forEach((j) => items.push({ type: 'jobs', id: j.id, title: j.title, meta: 'Job' }));
    (modProjects.data ?? []).forEach((p) => items.push({ type: 'projects', id: p.id, title: p.title, meta: 'Project' }));
    (modCourses.data ?? []).forEach((c) => items.push({ type: 'courses', id: c.id, title: c.title, meta: 'Course' }));
    (modEvents.data ?? []).forEach((e) => items.push({ type: 'events', id: e.id, title: e.title, meta: 'Event' }));
    setModerationItems(items);
    setStats({ members: members ?? 0, jobs: jobs ?? 0, projects: projects ?? 0, courses: courses ?? 0, bookings: bookings ?? 0, agencyProjects: agencyProjs ?? 0 });
    await loadPayments();
    await loadAnalytics();
  };

  const loadPayments = async () => {
    const [bk, en, ev, ag] = await Promise.all([
      supabase.from('bookings').select('id, payment_status, payment_note, amount, created_at, client_name, client_email, client_id, profiles:talent_id(full_name)').in('payment_status', ['unpaid', 'awaiting_confirmation']).order('created_at', { ascending: false }),
      supabase.from('enrollments').select('id, payment_status, payment_note, created_at, user_id, courses(title, price)').in('payment_status', ['unpaid', 'awaiting_confirmation']).order('created_at', { ascending: false }),
      supabase.from('event_rsvps').select('id, payment_status, payment_note, created_at, user_id, events(title, price)').in('payment_status', ['unpaid', 'awaiting_confirmation']).order('created_at', { ascending: false }),
      supabase.from('agency_projects').select('id, dp_payment_status, dp_payment_note, final_payment_status, final_payment_note, budget, dp_amount, created_at, client_name, client_company, agency_services(title)').order('created_at', { ascending: false }),
    ]);
    const rows: any[] = [];
    (bk.data ?? []).forEach((r: any) => rows.push({ table: 'bookings', id: r.id, category: 'Booking', item: r.profiles?.full_name ?? 'Talent', amount: r.amount, status: r.payment_status, note: r.payment_note, user: r.client_name ?? r.client_id, created_at: r.created_at }));
    (en.data ?? []).forEach((r: any) => rows.push({ table: 'enrollments', id: r.id, category: 'Course', item: r.courses?.title ?? 'Course', amount: r.courses?.price ?? 0, status: r.payment_status, note: r.payment_note, user: r.user_id, created_at: r.created_at }));
    (ev.data ?? []).forEach((r: any) => rows.push({ table: 'event_rsvps', id: r.id, category: 'Event', item: r.events?.title ?? 'Event', amount: r.events?.price ?? 0, status: r.payment_status, note: r.payment_note, user: r.user_id, created_at: r.created_at }));
    (ag.data ?? []).forEach((r: any) => {
      if (r.dp_payment_status === 'unpaid' || r.dp_payment_status === 'awaiting_confirmation') rows.push({ table: 'agency_projects', id: r.id, subField: 'dp', category: 'Agency DP', item: r.agency_services?.title ?? 'Project', amount: r.dp_amount ?? r.budget ?? 0, status: r.dp_payment_status, note: r.dp_payment_note, user: r.client_name, created_at: r.created_at });
      if (r.final_payment_status === 'unpaid' || r.final_payment_status === 'awaiting_confirmation') rows.push({ table: 'agency_projects', id: r.id, subField: 'final', category: 'Agency Final', item: r.agency_services?.title ?? 'Project', amount: r.budget ?? 0, status: r.final_payment_status, note: r.final_payment_note, user: r.client_name, created_at: r.created_at });
    });
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPayments(rows);
  };

  const markPaymentPaid = async (row: any) => {
    if (row.table === 'agency_projects') {
      const field = row.subField === 'dp' ? 'dp_payment_status' : 'final_payment_status';
      const confirmedField = row.subField === 'dp' ? 'dp_payment_confirmed_at' : 'final_payment_confirmed_at';
      const confirmedByField = row.subField === 'dp' ? 'dp_payment_confirmed_by' : 'final_payment_confirmed_by';
      const { error } = await supabase.from('agency_projects').update({ [field]: 'paid', [confirmedField]: new Date().toISOString(), [confirmedByField]: user?.id }).eq('id', row.id);
      if (error) { toast.error('Failed to mark as paid'); return; }
    } else {
      const { error } = await supabase.from(row.table).update({ payment_status: 'paid', payment_confirmed_at: new Date().toISOString(), payment_confirmed_by: user?.id }).eq('id', row.id);
      if (error) { toast.error('Failed to mark as paid'); return; }
    }
    toast.success('Payment marked as paid');
    loadPayments();
  };

  const resetPayment = async (row: any) => {
    if (row.table === 'agency_projects') {
      const field = row.subField === 'dp' ? 'dp_payment_status' : 'final_payment_status';
      const noteField = row.subField === 'dp' ? 'dp_payment_note' : 'final_payment_note';
      const { error } = await supabase.from('agency_projects').update({ [field]: 'unpaid', [noteField]: null }).eq('id', row.id);
      if (error) { toast.error('Failed to reset'); return; }
    } else {
      const { error } = await supabase.from(row.table).update({ payment_status: 'unpaid', payment_note: null }).eq('id', row.id);
      if (error) { toast.error('Failed to reset'); return; }
    }
    toast.success('Payment reset');
    loadPayments();
  };

  const loadAnalytics = async () => {
    const { data: profiles } = await supabase.from('profiles').select('created_at');
    const { data: roleData } = await supabase.from('user_roles').select('role');
    const { data: jobsData } = await supabase.from('jobs').select('created_at');
    const { data: appsData } = await supabase.from('job_applications').select('created_at');
    const { data: bookingsData } = await supabase.from('bookings').select('amount, created_at, payment_status');
    const { data: agencyData } = await supabase.from('agency_projects').select('budget, dp_amount, dp_payment_status, final_payment_status, created_at');
    setAnalyticsData({ profiles, roleData, jobsData, appsData, bookingsData, agencyData });
  };

  const approveCompany = async (id: string, status: string) => {
    const { error } = await supabase.from('companies').update({ approval_status: status }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(`Company ${status}`);
    setCompanies(companies.map((c) => c.id === id ? { ...c, approval_status: status } : c));
  };

  const approveUser = async (id: string, field: 'coach_approved' | 'talent_approved', status: string) => {
    const { error } = await supabase.from('profiles').update({ [field]: status }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(`${field.includes('coach') ? 'Coach' : 'Talent'} ${status}`);
    setCoaches(coaches.map((c) => c.id === id ? { ...c, [field]: status } : c));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from('app_settings').update({
      talent_admin_fee_percentage: parseFloat(settings.talent_admin_fee_percentage),
      agency_admin_fee_percentage: parseFloat(settings.agency_admin_fee_percentage),
      agency_revenue_share_percentage: parseFloat(settings.agency_revenue_share_percentage),
      job_fee_active: settings.job_fee_active,
      project_fee_active: settings.project_fee_active,
      lms_fee_active: settings.lms_fee_active,
      event_fee_active: settings.event_fee_active,
      lynkid_bookings_url: settings.lynkid_bookings_url ?? null,
      lynkid_agency_url: settings.lynkid_agency_url ?? null,
      lynkid_courses_url: settings.lynkid_courses_url ?? null,
      lynkid_events_url: settings.lynkid_events_url ?? null,
    }).eq('id', settings.id);
    setSavingSettings(false);
    if (error) { toast.error('Failed to save settings'); return; }
    toast.success('Settings saved!');
  };

  const updateAgencyStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('agency_projects').update({ status }).eq('id', id);
    if (error) { toast.error('Failed to update status'); return; }
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
    setAgencyProjects(agencyProjects.map((p) => p.id === id ? { ...p, status } : p));
  };

  const deleteContent = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Content deleted');
    setModerationItems(moderationItems.filter((m) => !(m.type === table && m.id === id)));
  };

  if (loading || !authChecked) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold">{t('Admin Panel', 'Panel Admin')}</h1>
            <p className="text-muted-foreground">{t('Manage approvals, fees, and platform settings.', 'Kelola approval, biaya, dan pengaturan platform.')}</p>
          </div>
        </div>

        {/* Dashboard stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: t('Total Members', 'Total Member'), value: stats.members, icon: Users, color: 'text-blue-400' },
            { label: t('Active Jobs', 'Lowongan Aktif'), value: stats.jobs, icon: Briefcase, color: 'text-cyan-400' },
            { label: t('Active Projects', 'Proyek Aktif'), value: stats.projects, icon: Code2, color: 'text-violet-400' },
            { label: t('Active Courses', 'Kursus Aktif'), value: stats.courses, icon: GraduationCap, color: 'text-amber-400' },
            { label: t('Bookings (This Month)', 'Booking (Bulan Ini)'), value: stats.bookings, icon: Star, color: 'text-emerald-400' },
            { label: t('Agency Projects (This Month)', 'Proyek Agency (Bulan Ini)'), value: stats.agencyProjects, icon: TrendingUp, color: 'text-pink-400' },
          ].map((s) => (
            <Card key={s.label} className="glass">
              <CardContent className="p-4">
                <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="approvals">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="approvals">{t('Approvals', 'Approval')}</TabsTrigger>
            <TabsTrigger value="payments">{t('Payments', 'Pembayaran')}</TabsTrigger>
            <TabsTrigger value="agency">{t('Agency Projects', 'Proyek Agency')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('Analytics', 'Analitik')}</TabsTrigger>
            <TabsTrigger value="fees">{t('Fee Management', 'Kelola Biaya')}</TabsTrigger>
            <TabsTrigger value="moderation">{t('Moderation', 'Moderasi')}</TabsTrigger>
          </TabsList>

          {/* Approvals */}
          <TabsContent value="approvals" className="space-y-6">
            {/* Companies */}
            <Card className="glass">
              <CardHeader><CardTitle>{t('Company Approvals', 'Approval Perusahaan')}</CardTitle></CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No companies registered.', 'Belum ada perusahaan terdaftar.')}</p>
                ) : (
                  <div className="space-y-3">
                    {companies.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-muted-foreground">{c.industry} • {c.location} • by {c.profiles?.full_name ?? 'Unknown'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.approval_status === 'approved' ? 'default' : c.approval_status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{c.approval_status}</Badge>
                          {c.approval_status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => approveCompany(c.id, 'approved')} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Approve', 'Setujui')}</Button>
                              <Button size="sm" variant="outline" onClick={() => approveCompany(c.id, 'rejected')} className="gap-1"><X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}</Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coaches & Talents */}
            <Card className="glass">
              <CardHeader><CardTitle>{t('Coach & Talent Approvals', 'Approval Coach & Talent')}</CardTitle></CardHeader>
              <CardContent>
                {coaches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No applications yet.', 'Belum ada pendaftaran.')}</p>
                ) : (
                  <div className="space-y-3">
                    {coaches.map((c) => (
                      <div key={c.id} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{c.full_name ?? 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">{c.bio?.slice(0, 80) ?? 'No bio'}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {c.is_coach && (
                            <>
                              <Badge variant="secondary" className="gap-1"><GraduationCap className="h-3 w-3" /> Coach: {c.coach_approved}</Badge>
                              {c.coach_approved === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => approveUser(c.id, 'coach_approved', 'approved')} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Approve Coach', 'Setujui Coach')}</Button>
                                  <Button size="sm" variant="outline" onClick={() => approveUser(c.id, 'coach_approved', 'rejected')} className="gap-1"><X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}</Button>
                                </>
                              )}
                            </>
                          )}
                          {c.is_talent && (
                            <>
                              <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> Talent: {c.talent_approved}</Badge>
                              {c.talent_approved === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => approveUser(c.id, 'talent_approved', 'approved')} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Approve Talent', 'Setujui Talent')}</Button>
                                  <Button size="sm" variant="outline" onClick={() => approveUser(c.id, 'talent_approved', 'rejected')} className="gap-1"><X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}</Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> {t('Payment Verification', 'Verifikasi Pembayaran')}</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{t('Verify payments submitted by users across bookings, courses, events, and agency projects.', 'Verifikasi pembayaran yang dikirim pengguna untuk booking, kursus, event, dan proyek agency.')}</p>
                {payments.length === 0 ? (
                  <div className="py-8 text-center">
                    <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t('No pending payments.', 'Tidak ada pembayaran tertunda.')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((row, i) => (
                      <div key={`${row.table}-${row.id}-${row.subField ?? ''}-${i}`} className="rounded-lg border border-border/60 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{row.category}</Badge>
                              <span className="font-medium">{row.item}</span>
                              <Badge variant={row.status === 'awaiting_confirmation' ? 'secondary' : 'outline'} className="text-xs">
                                {row.status === 'awaiting_confirmation' ? t('Awaiting', 'Menunggu') : t('Unpaid', 'Belum Bayar')}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {t('Amount', 'Jumlah')}: <span className="font-medium text-foreground">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.amount)}</span>
                            </p>
                            {row.note && <p className="mt-1 text-xs text-muted-foreground">{t('Note', 'Catatan')}: {row.note}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => markPaymentPaid(row)} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Mark Paid', 'Tandai Lunas')}</Button>
                            <Button size="sm" variant="outline" onClick={() => resetPayment(row)} className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> {t('Reset', 'Reset')}</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agency Projects */}
          <TabsContent value="agency" className="space-y-6">
            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><FolderKanban className="h-5 w-5" /> {t('Agency Project Pipeline', 'Pipeline Proyek Agency')}</CardTitle></CardHeader>
              <CardContent>
                {agencyProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No agency projects yet.', 'Belum ada proyek agency.')}</p>
                ) : (
                  <div className="space-y-3">
                    {agencyProjects.map((p) => (
                      <div key={p.id} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{p.client_name} {p.client_company && `· ${p.client_company}`}</p>
                            <p className="text-sm text-muted-foreground">{p.agency_services?.category ?? 'N/A'} — {p.agency_services?.title ?? 'N/A'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{p.scope?.slice(0, 100) ?? 'No scope'}</p>
                            {p.budget && <p className="mt-1 text-xs text-muted-foreground">{t('Budget', 'Budget')}: Rp {(p.budget / 1000000).toFixed(1)}M</p>}
                          </div>
                          <Badge variant={p.status === 'completed' ? 'default' : p.status === 'in_review' ? 'secondary' : 'outline'} className="capitalize">{p.status?.replace('_', ' ')}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Select defaultValue={p.status} onValueChange={(v) => updateAgencyStatus(p.id, v)}>
                            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_review">{t('In Review', 'Perlu Direview')}</SelectItem>
                              <SelectItem value="team_assigned">{t('Team Assigned', 'Tim Ditugaskan')}</SelectItem>
                              <SelectItem value="in_progress">{t('In Progress', 'Dikerjakan')}</SelectItem>
                              <SelectItem value="delivery">{t('Delivery', 'Delivery')}</SelectItem>
                              <SelectItem value="completed">{t('Completed', 'Selesai')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsCharts data={analyticsData} t={t} />
          </TabsContent>

          {/* Fee Management */}
          <TabsContent value="fees">
            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> {t('Fee & Revenue Share Configuration', 'Konfigurasi Biaya & Revenue Share')}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="taf">{t('Talent Admin Fee (%)', 'Biaya Admin Talent (%)')}</Label>
                        <Input id="taf" type="number" step="0.01" value={settings.talent_admin_fee_percentage} onChange={(e) => setSettings({ ...settings, talent_admin_fee_percentage: e.target.value })} />
                        <p className="text-xs text-muted-foreground">{t('Deducted from each talent booking', 'Dipotong dari setiap booking talent')}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aaf">{t('Agency Admin Fee (%)', 'Biaya Admin Agency (%)')}</Label>
                        <Input id="aaf" type="number" step="0.01" value={settings.agency_admin_fee_percentage} onChange={(e) => setSettings({ ...settings, agency_admin_fee_percentage: e.target.value })} />
                        <p className="text-xs text-muted-foreground">{t('Charged on DP payment', 'Dikenakan pada pembayaran DP')}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ars">{t('Agency Revenue Share (%)', 'Revenue Share Agency (%)')}</Label>
                        <Input id="ars" type="number" step="0.01" value={settings.agency_revenue_share_percentage} onChange={(e) => setSettings({ ...settings, agency_revenue_share_percentage: e.target.value })} />
                        <p className="text-xs text-muted-foreground">{t('Applied on final payment', 'Diterapkan pada pembayaran akhir')}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">{t('Lynk.id Payment Links', 'Link Pembayaran Lynk.id')}</h4>
                      <p className="text-xs text-muted-foreground">{t('Default fallback payment links for each category. Admin can override per record.', 'Link pembayaran default per kategori. Admin dapat override per record.')}</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="lb">{t('Bookings Lynk.id URL', 'URL Lynk.id Booking')}</Label>
                          <Input id="lb" value={settings.lynkid_bookings_url ?? ''} onChange={(e) => setSettings({ ...settings, lynkid_bookings_url: e.target.value })} placeholder="https://lynk.id/your-booking-product" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="la">{t('Agency Lynk.id URL', 'URL Lynk.id Agency')}</Label>
                          <Input id="la" value={settings.lynkid_agency_url ?? ''} onChange={(e) => setSettings({ ...settings, lynkid_agency_url: e.target.value })} placeholder="https://lynk.id/your-agency-product" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lc">{t('Courses Lynk.id URL', 'URL Lynk.id Kursus')}</Label>
                          <Input id="lc" value={settings.lynkid_courses_url ?? ''} onChange={(e) => setSettings({ ...settings, lynkid_courses_url: e.target.value })} placeholder="https://lynk.id/your-course-product" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="le">{t('Events Lynk.id URL', 'URL Lynk.id Event')}</Label>
                          <Input id="le" value={settings.lynkid_events_url ?? ''} onChange={(e) => setSettings({ ...settings, lynkid_events_url: e.target.value })} placeholder="https://lynk.id/your-event-product" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">{t('Module Fee Activation', 'Aktivasi Biaya Modul')}</h4>
                      <p className="text-xs text-muted-foreground">{t('Toggle fees for community modules. Currently inactive (free) for MVP.', 'Aktifkan biaya untuk modul komunitas. Saat ini nonaktif (gratis) untuk MVP.')}</p>
                      {[
                        { key: 'job_fee_active', label: t('Job Portal Fees', 'Biaya Job Portal') },
                        { key: 'project_fee_active', label: t('Project Portal Fees', 'Biaya Project Portal') },
                        { key: 'lms_fee_active', label: t('LMS Fees', 'Biaya LMS') },
                        { key: 'event_fee_active', label: t('Event Fees', 'Biaya Event') },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                          <span className="text-sm">{item.label}</span>
                          <Button
                            size="sm"
                            variant={settings[item.key] ? 'default' : 'outline'}
                            onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                          >
                            {settings[item.key] ? t('Active', 'Aktif') : t('Inactive', 'Nonaktif')}
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
                      {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />} {t('Save Settings', 'Simpan Pengaturan')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation */}
          <TabsContent value="moderation">
            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5" /> {t('Content Moderation', 'Moderasi Konten')}</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{t('Review and remove listings that violate community guidelines.', 'Tinjau dan hapus listing yang melanggar pedoman komunitas.')}</p>
                {moderationItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No content to moderate.', 'Tidak ada konten untuk dimoderasi.')}</p>
                ) : (
                  <div className="space-y-2">
                    {moderationItems.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">{item.meta}</Badge>
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => deleteContent(item.type, item.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> {t('Delete', 'Hapus')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
