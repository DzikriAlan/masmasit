'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Check, X, Users, Briefcase, Code2, GraduationCap, Star, TrendingUp, Settings, Calendar, FolderKanban, Flag, Trash2, Ban, CreditCard, BarChart3, ExternalLink, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AnalyticsCharts } from '@/components/analytics-charts';

import type { DataAdminPayments } from '@/features/admin/types/adminTypes';
import { useAdminControllers } from '@/features/admin/controllers/adminControllers';
import AdminRoles from '@/features/admin/components/AdminRoles';
import AdminAuditLog from '@/features/admin/components/AdminAuditLog';
import AdminCatalog from '@/features/admin/components/AdminCatalog';

export default function AdminDashboard() {
  const { user, roles, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [pendingOnly, setPendingOnly] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || (!roles.includes('super_admin') && !roles.includes('regional_admin'))) {
        router.push('/dashboard');
      } else {
        setAuthChecked(true);
      }
    }
  }, [user, roles, loading, router]);

  const {
    fetchAdminCompanies,
    fetchAdminCoaches,
    fetchAdminSettings,
    fetchAdminStats,
    fetchAdminAgencyProjects,
    fetchAdminModeration,
    fetchAdminPayments,
    fetchAdminAnalytics,
    changeAdminCompanyApproval,
    changeAdminUserApproval,
    changeAdminSettings,
    changeAdminAgencyStatus,
    changeAdminPaymentPaid,
    changeAdminPaymentReset,
    removeAdminContent,
    fetchAdminApprovals,
    changeAdminEventApproval,
  } = useAdminControllers(user?.id, authChecked);

  const isSuperAdmin = roles.includes('super_admin');
  const approvals = fetchAdminApprovals.data ?? null;
  const pendingEvents = approvals?.events ?? [];


  const companies = fetchAdminCompanies.data ?? [];
  const coaches = fetchAdminCoaches.data ?? [];
  const agencyProjects = fetchAdminAgencyProjects.data ?? [];
  const moderationItems = fetchAdminModeration.data ?? [];
  const payments = fetchAdminPayments.data ?? [];
  const analyticsData = fetchAdminAnalytics.data ?? null;
  const stats = fetchAdminStats.data ?? { members: 0, jobs: 0, projects: 0, courses: 0, bookings: 0, agencyProjects: 0 };
  const savingSettings = changeAdminSettings.isPending;

  // Approvals default to the queue that still needs a decision; the toggle
  // reveals the full history.
  const visibleCompanies = pendingOnly
    ? companies.filter((c) => c.approval_status === 'pending')
    : companies;
  const visiblePeople = pendingOnly
    ? coaches.filter((c) => c.coach_approved === 'pending' || c.talent_approved === 'pending')
    : coaches;


  // The fee form is edited in place, so it seeds from the fetched row once and
  // is then owned by the component until saved.
  const settings = settingsForm ?? fetchAdminSettings.data ?? null;
  const setSettings = setSettingsForm;

  useEffect(() => {
    if (fetchAdminSettings.data && !settingsForm) setSettingsForm(fetchAdminSettings.data);
  }, [fetchAdminSettings.data, settingsForm]);

  const modifyPaymentPaid = async (row: DataAdminPayments) => {
    try {
      await changeAdminPaymentPaid.mutateAsync({ table: row.table, id: row.id, subField: row.subField });
    } catch {
      toast.error('Failed to mark as paid');
      return;
    }
    toast.success('Payment marked as paid');
  };

  const modifyPaymentReset = async (row: DataAdminPayments) => {
    try {
      await changeAdminPaymentReset.mutateAsync({ table: row.table, id: row.id, subField: row.subField });
    } catch {
      toast.error('Failed to reset');
      return;
    }
    toast.success('Payment reset');
  };

  const modifyCompanyApproval = async (id: string, status: string) => {
    try {
      await changeAdminCompanyApproval.mutateAsync({ id, status });
    } catch {
      toast.error('Failed to update');
      return;
    }
    toast.success(`Company ${status}`);
  };

  const modifyUserApproval = async (id: string, field: 'coach_approved' | 'talent_approved', status: string) => {
    try {
      await changeAdminUserApproval.mutateAsync({ id, field, status });
    } catch {
      toast.error('Failed to update');
      return;
    }
    toast.success(`${field.includes('coach') ? 'Coach' : 'Talent'} ${status}`);
  };

  const saveSettings = async () => {
    try {
      await changeAdminSettings.mutateAsync({
        id: settings.id,
        settings: {
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
        },
      });
    } catch {
      toast.error('Failed to save settings');
      return;
    }
    toast.success('Settings saved!');
  };

  const modifyAgencyStatus = async (id: string, status: string) => {
    try {
      await changeAdminAgencyStatus.mutateAsync({ id, status });
    } catch {
      toast.error('Failed to update status');
      return;
    }
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
  };

  const modifyEventApproval = async (id: string, status: string) => {
    try {
      await changeAdminEventApproval.mutateAsync({ id, status });
    } catch {
      toast.error('Failed to update event');
      return;
    }
    toast.success(`Event ${status}`);
  };

  const destroyContent = async (table: string, id: string) => {
    try {
      await removeAdminContent.mutateAsync({ table, id });
    } catch {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Content deleted');
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
            <TabsTrigger value="catalog">{t('Catalog', 'Katalog')}</TabsTrigger>
            <TabsTrigger value="roles">{t('Roles', 'Peran')}</TabsTrigger>
            <TabsTrigger value="audit">{t('Audit Log', 'Catatan Audit')}</TabsTrigger>
          </TabsList>

          {/* Approvals */}
          <TabsContent value="approvals" className="space-y-6">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setPendingOnly(!pendingOnly)} className="gap-2">
                {pendingOnly ? t('Show all', 'Tampilkan semua') : t('Show pending only', 'Tampilkan yang menunggu saja')}
              </Button>
            </div>

            {/* Events awaiting approval */}
            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> {t('Event Approvals', 'Approval Event')}</CardTitle></CardHeader>
              <CardContent>
                {pendingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No events waiting for approval.', 'Tidak ada event yang menunggu persetujuan.')}</p>
                ) : (
                  <div className="space-y-3">
                    {pendingEvents.map((e) => (
                      <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="capitalize">{e.event_type}</span> · {e.location}
                            {e.regions?.name ? ` · ${e.regions.name}` : ''} · {new Date(e.event_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => modifyEventApproval(e.id, 'approved')} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Approve', 'Setujui')}</Button>
                          <Button size="sm" variant="outline" onClick={() => modifyEventApproval(e.id, 'rejected')} className="gap-1"><X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Companies */}
            <Card className="glass">
              <CardHeader><CardTitle>{t('Company Approvals', 'Approval Perusahaan')}</CardTitle></CardHeader>
              <CardContent>
                {visibleCompanies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('Nothing waiting for a decision.', 'Tidak ada yang menunggu keputusan.')}</p>
                ) : (
                  <div className="space-y-3">
                    {visibleCompanies.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-muted-foreground">{c.industry} • {c.location} • by {c.profiles?.full_name ?? 'Unknown'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.approval_status === 'approved' ? 'default' : c.approval_status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{c.approval_status}</Badge>
                          {c.approval_status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => modifyCompanyApproval(c.id, 'approved')} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Approve', 'Setujui')}</Button>
                              <Button size="sm" variant="outline" onClick={() => modifyCompanyApproval(c.id, 'rejected')} className="gap-1"><X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}</Button>
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
                {visiblePeople.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No applications yet.', 'Belum ada pendaftaran.')}</p>
                ) : (
                  <div className="space-y-3">
                    {visiblePeople.map((c) => (
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
                                  <Button size="sm" onClick={() => modifyUserApproval(c.id, 'coach_approved', 'approved')} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Approve Coach', 'Setujui Coach')}</Button>
                                  <Button size="sm" variant="outline" onClick={() => modifyUserApproval(c.id, 'coach_approved', 'rejected')} className="gap-1"><X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}</Button>
                                </>
                              )}
                            </>
                          )}
                          {c.is_talent && (
                            <>
                              <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> Talent: {c.talent_approved}</Badge>
                              {c.talent_approved === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => modifyUserApproval(c.id, 'talent_approved', 'approved')} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Approve Talent', 'Setujui Talent')}</Button>
                                  <Button size="sm" variant="outline" onClick={() => modifyUserApproval(c.id, 'talent_approved', 'rejected')} className="gap-1"><X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}</Button>
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
                            <Button size="sm" onClick={() => modifyPaymentPaid(row)} className="gap-1"><Check className="h-3.5 w-3.5" /> {t('Mark Paid', 'Tandai Lunas')}</Button>
                            <Button size="sm" variant="outline" onClick={() => modifyPaymentReset(row)} className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> {t('Reset', 'Reset')}</Button>
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
                          <Select defaultValue={p.status} onValueChange={(v) => modifyAgencyStatus(p.id, v)}>
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
                          <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => destroyContent(item.type, item.id)}>
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

          <TabsContent value="catalog">
            <AdminCatalog enabled={authChecked} />
          </TabsContent>

          <TabsContent value="roles">
            <AdminRoles isSuperAdmin={isSuperAdmin} currentUserId={user?.id} />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditLog enabled={authChecked} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
