'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Briefcase, Code2, GraduationCap, Calendar, Star, Users, Settings, ShieldCheck, TrendingUp, FileText, MessageCircle, Mail, Send } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { useDashboardControllers } from '@/features/dashboard/controllers/dashboardControllers';

export default function DashboardOverview() {
  const { user, profile, roles, loading, isEmailVerified, resendVerification } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [sendingVerification, setSendingVerification] = useState(false);

  const { fetchDashboardStats } = useDashboardControllers(user?.id);

  const stats = fetchDashboardStats.data ?? { applications: 0, projects: 0, enrollments: 0, rsvps: 0 };
  const isAdmin = roles.includes('super_admin') || roles.includes('regional_admin');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickLinks = [
    { href: '/directory', icon: Users, label: t('Browse Members', 'Jelajahi Member'), desc: t('Connect with IT practitioners', 'Terhubung dengan praktisi IT') },
    { href: '/jobs', icon: Briefcase, label: t('Find Jobs', 'Cari Kerja'), desc: t('Browse open positions', 'Jelajahi lowongan') },
    { href: '/projects', icon: Code2, label: t('Projects', 'Proyek'), desc: t('Post or bid on projects', 'Pasang atau tawar proyek') },
    { href: '/courses', icon: GraduationCap, label: t('Learn', 'Belajar'), desc: t('Enroll in courses', 'Ikuti kursus') },
    { href: '/events', icon: Calendar, label: t('Events', 'Event'), desc: t('Join community events', 'Ikuti event komunitas') },
    { href: '/talents', icon: Star, label: t('Book Talent', 'Pesan Talent'), desc: t('Hire expert consultants', 'Sewa konsultan ahli') },
    { href: '/pesan', icon: MessageCircle, label: t('Messages', 'Pesan'), desc: t('Chat with the community', 'Chat dengan komunitas') },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-up">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
            {t('Dashboard', 'Dasbor')}
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
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

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t('Job Applications', 'Lamaran Kerja'), value: stats.applications, icon: Briefcase, color: 'text-blue-400' },
            { label: t('My Projects', 'Proyek Saya'), value: stats.projects, icon: Code2, color: 'text-violet-400' },
            { label: t('Enrollments', 'Pendaftaran'), value: stats.enrollments, icon: GraduationCap, color: 'text-amber-400' },
            { label: t('Event RSVPs', 'RSVP Event'), value: stats.rsvps, icon: Calendar, color: 'text-emerald-400' },
          ].map((s, i) => (
            <Card key={s.label} className={`glass glass-hover stagger-${i + 1}`}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-transform group-hover:scale-110">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="mb-4 font-display text-xl font-semibold">{t('Quick Access', 'Akses Cepat')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, i) => (
            <Link key={link.href} href={link.href}>
              <Card className={`group glass glass-hover h-full stagger-${(i % 6) + 1}`}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
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
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> {t('Admin Panel', 'Panel Admin')}
              </Button>
            </Link>
          )}
          <Link href="/profile">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" /> {t('Edit Profile', 'Edit Profil')}
            </Button>
          </Link>
          {(profile?.is_coach || profile?.coach_approved === 'approved') && (
            <Link href="/coach">
              <Button variant="outline" className="gap-2">
                <GraduationCap className="h-4 w-4" /> {t('Coach Dashboard', 'Dashboard Coach')}
              </Button>
            </Link>
          )}
          <Link href="/case-studies">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" /> {t('Case Studies', 'Studi Kasus')}
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
