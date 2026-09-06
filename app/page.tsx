'use client';

import Link from 'next/link';
import {
  ArrowRight, Users, Briefcase, GraduationCap,
  Code2, Brain, Palette, UsersRound, Star,
  MessageCircle, CalendarClock, Mail,
  MapPin, Quote, ChevronLeft, ChevronRight,
  TrendingUp, UserPlus, Compass, Handshake, Sprout,
  Shield, Cloud, Bug, Megaphone, Blocks,
  Activity, Sparkles, Zap, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/components/language-provider';
import { AppShell } from '@/components/app-shell';

const heroImg = 'https://images.pexels.com/photos/7652188/pexels-photo-7652188.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const heroImg2 = 'https://images.pexels.com/photos/7534107/pexels-photo-7534107.jpeg?auto=compress&cs=tinysrgb&h=400&w=400';
const heroImg3 = 'https://images.pexels.com/photos/12902899/pexels-photo-12902899.jpeg?auto=compress&cs=tinysrgb&h=300&w=300';

const mentorPhotos = [
  'https://images.pexels.com/photos/5308640/pexels-photo-5308640.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/6942776/pexels-photo-6942776.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/749091/pexels-photo-749091.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/7534107/pexels-photo-7534107.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/7752820/pexels-photo-7752820.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  'https://images.pexels.com/photos/15014092/pexels-photo-15014092.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
];

const galleryImages = [
  { url: 'https://images.pexels.com/photos/7652188/pexels-photo-7652188.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Team collaboration', id: 'Kolaborasi tim' },
  { url: 'https://images.pexels.com/photos/8101931/pexels-photo-8101931.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Deep work', id: 'Fokus mendalam' },
  { url: 'https://images.pexels.com/photos/8761524/pexels-photo-8761524.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Conference', id: 'Konferensi' },
  { url: 'https://images.pexels.com/photos/17724731/pexels-photo-17724731.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Brainstorm sessions', id: 'Sesi brainstorm' },
  { url: 'https://images.pexels.com/photos/9301872/pexels-photo-9301872.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Creative workshop', id: 'Workshop kreatif' },
  { url: 'https://images.pexels.com/photos/7643736/pexels-photo-7643736.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Community meetup', id: 'Meetup komunitas' },
  { url: 'https://images.pexels.com/photos/10375906/pexels-photo-10375906.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Diverse teams', id: 'Tim beragam' },
  { url: 'https://images.pexels.com/photos/8518816/pexels-photo-8518816.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', en: 'Shipping together', id: 'Shipping bersama' },
];

const newsItems = [
  { en: 'New jobs posted today across 12 regions', id: 'Lowongan baru hari ini di 12 wilayah' },
  { en: 'Fresh talent verified this week', id: 'Talent baru terverifikasi minggu ini' },
  { en: 'New marketplace filters now live', id: 'Filter marketplace baru kini tersedia' },
  { en: 'Direct messaging keeps you in control', id: 'Pesan langsung, tanpa perantara' },
  { en: 'Match score helps you find the right fit', id: 'Match score bantu temukan kandidat tepat' },
];

const skillCategories = [
  { icon: Code2, en: 'Software Engineering', id: 'Software Engineering' },
  { icon: Brain, en: 'Data & AI', id: 'Data & AI' },
  { icon: Compass, en: 'Product Management', id: 'Product Management' },
  { icon: Palette, en: 'UI/UX & Creative', id: 'UI/UX & Creative' },
  { icon: Cloud, en: 'DevOps & Infrastructure', id: 'DevOps & Infrastructure' },
  { icon: Shield, en: 'Cybersecurity', id: 'Cybersecurity' },
  { icon: Bug, en: 'QA & Testing', id: 'QA & Testing' },
  { icon: UsersRound, en: 'HR & People', id: 'HR & People' },
  { icon: Megaphone, en: 'Digital Marketing & Growth', id: 'Digital Marketing & Growth' },
  { icon: Blocks, en: 'No-Code/Low-Code', id: 'No-Code/Low-Code' },
  { icon: Handshake, en: 'Sales & Business Development', id: 'Sales & Business Development' },
];

const howItWorks = [
  { icon: UserPlus, en: 'Create Profile', id: 'Buat Profil', desc_en: 'Sign up, add your skills, experience, and portfolio.', desc_id: 'Daftar, tambahkan skill, pengalaman, dan portofolio.' },
  { icon: Compass, en: 'Explore', id: 'Jelajahi', desc_en: 'Browse jobs, projects, talents, and courses.', desc_id: 'Jelajahi lowongan, proyek, talent, dan kursus.' },
  { icon: Handshake, en: 'Connect', id: 'Terhubung', desc_en: 'Apply, bid, book sessions, or message members.', desc_id: 'Lamar, tawar, pesan sesi, atau chat member.' },
  { icon: Sprout, en: 'Grow', id: 'Tumbuh', desc_en: 'Learn, earn, and advance your career.', desc_id: 'Belajar, hasilkan, dan kembangkan karier.' },
];

const features = [
  { icon: Users, en: 'Member Directory', id: 'Direktori Member', desc_en: 'Find IT practitioners by skill & location.', desc_id: 'Cari praktisi IT berdasarkan skill & lokasi.' },
  { icon: Briefcase, en: 'Job Portal', id: 'Job Portal', desc_en: 'Post jobs, apply with one click.', desc_id: 'Pasang lowongan, lamar sekali klik.' },
  { icon: Code2, en: 'Project Portal', id: 'Project Portal', desc_en: 'Post projects, receive bids, hire.', desc_id: 'Pasang proyek, terima penawaran, rekrut.' },
  { icon: GraduationCap, en: 'LMS + Coaching', id: 'LMS + Coaching', desc_en: 'Courses with quizzes & certificates.', desc_id: 'Kursus dengan kuis & sertifikat.' },
  { icon: CalendarClock, en: 'Events', id: 'Event', desc_en: 'Meetups, workshops & hackathons.', desc_id: 'Meetup, workshop & hackathon.' },
  { icon: TrendingUp, en: 'Agency Services', id: 'Layanan Agency', desc_en: 'End-to-end digital product delivery.', desc_id: 'Pengiriman produk digital end-to-end.' },
];

const services = [
  { icon: Code2, title: 'SaaS', en: 'Product & cloud platforms', id: 'Produk & platform cloud' },
  { icon: Brain, title: 'AI', en: 'Chatbots, ML & data pipelines', id: 'Chatbot, ML & data pipeline' },
  { icon: Palette, title: 'Creative', en: 'Design, brand & UI kits', id: 'Desain, brand & UI kit' },
  { icon: UsersRound, title: 'HR', en: 'Recruitment & HRIS', id: 'Rekrutmen & HRIS' },
];

const testimonials = [
  { text_en: 'Every interaction feels intentional. This platform gave me clarity I\'d been searching for.', text_id: 'Setiap interaksi terasa intentional. Platform ini memberi kejelasan yang saya cari.', author: 'Rizky Pratama', role: 'Backend Dev · Jakarta', photo: mentorPhotos[0] },
  { text_en: 'It goes beyond functionality — it offers direction. The authenticity is unmatched.', text_id: 'Melampaui fungsionalitas — ia memberi arah. Keasliannya tak tertandingi.', author: 'Sarah Wijaya', role: 'Founder · Bandung', photo: mentorPhotos[4] },
  { text_en: 'Simple and deep. I could focus on meaningful outcomes, not processes.', text_id: 'Simpel dan mendalam. Saya bisa fokus pada hasil, bukan proses.', author: 'Aditya Nugroho', role: 'Data Scientist · Surabaya', photo: mentorPhotos[1] },
  { text_en: 'It doesn\'t overwhelm, yet delivers depth where it matters. Professional and personal.', text_id: 'Tidak berlebihan, tapi memberi kedalaman di tempat penting. Profesional dan personal.', author: 'Maya Sari', role: 'Product Designer · Yogya', photo: mentorPhotos[5] },
];

const matchPreviewJobs = [
  { title: 'Senior Frontend Developer', company: 'PT Tech Nusantara', location: 'Remote', match: 94 },
  { title: 'Product Designer', company: 'Kreasi Studio', location: 'Jakarta', match: 88 },
  { title: 'Data Engineer', company: 'NusaData', location: 'Bandung', match: 81 },
];

export default function HomePage() {
  const { t, lang } = useLang();
  const [stats, setStats] = useState({ members: 0, jobs: 0, projects: 0, courses: 0 });
  const [talents, setTalents] = useState<any[]>([]);
  const [activeT, setActiveT] = useState(0);
  const [activity, setActivity] = useState<{ label_en: string; label_id: string; count: number }[]>([]);
  const [activeNews, setActiveNews] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ count: members }, { count: jobs }, { count: projects }, { count: courses }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ members: members ?? 0, jobs: jobs ?? 0, projects: projects ?? 0, courses: courses ?? 0 });

      const { data: tal } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, location, linkedin_url')
        .eq('is_talent', true)
        .eq('talent_approved', 'approved')
        .limit(4);
      setTalents(tal ?? []);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const [{ count: jobsToday }, { count: membersWeek }, { count: projectsWeek }, { count: bookingsMonth }] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('projects').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);
      setActivity([
        { label_en: 'New jobs today', label_id: 'Lowongan baru hari ini', count: jobsToday ?? 0 },
        { label_en: 'New members this week', label_id: 'Member baru minggu ini', count: membersWeek ?? 0 },
        { label_en: 'New projects this week', label_id: 'Proyek baru minggu ini', count: projectsWeek ?? 0 },
        { label_en: 'Talent bookings this month', label_id: 'Booking talent bulan ini', count: bookingsMonth ?? 0 },
      ]);
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveT((p) => (p + 1) % testimonials.length), 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveNews((p) => (p + 1) % newsItems.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* NEWS TICKER — mcity style */}
        <div className="border-b border-border/30 bg-card/50 py-1.5 overflow-hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Badge variant="default" className="shrink-0 gap-1 text-[0.65rem]">
              <Sparkles className="h-2.5 w-2.5" /> {t('News', 'Info')}
            </Badge>
            <div className="relative flex-1 overflow-hidden">
              <div key={activeNews} className="animate-fade-up text-xs text-muted-foreground">
                {t(newsItems[activeNews].en, newsItems[activeNews].id)}
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              {newsItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveNews(i)}
                  className={`h-1 rounded-full transition-all ${i === activeNews ? 'w-4 bg-primary' : 'w-1 bg-muted'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden bg-mesh">
          <div className="absolute inset-0 bg-grid opacity-[0.03]" />
          <div className="absolute inset-0 bg-hero-radial" />
          <div className="absolute left-1/4 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[150px] animate-pulse-soft" />
          <div className="absolute right-0 bottom-0 h-[300px] w-[400px] rounded-full bg-accent/[0.05] blur-[120px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />

          <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8 lg:pt-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="animate-fade-up">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
                  {t('Indonesian IT Community', 'Komunitas IT Indonesia')}
                </div>
                <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
                  {t('Find opportunities.', 'Temukan peluang.')}{' '}
                  <span className="text-gradient-brand animate-gradient">{t('Offer services.', 'Tawarkan layanan.')}</span>{' '}
                  {t('Grow together.', 'Tumbuh bersama.')}
                </h1>
                <p className="mt-5 max-w-lg text-base text-muted-foreground lg:text-lg">
                  {t(
                    'Connect with Indonesian IT practitioners for jobs, projects, mentorship & collaboration.',
                    'Terhubung dengan praktisi IT Indonesia untuk pekerjaan, proyek, mentorship & kolaborasi.'
                  )}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="gap-2 glow-primary">
                      {t('Join Community', 'Gabung Komunitas')} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/talents">
                    <Button size="lg" variant="outline" className="gap-2">
                      <Star className="h-4 w-4" /> {t('Find Talent', 'Cari Talent')}
                    </Button>
                  </Link>
                </div>

                {/* Trust line */}
                <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2">
                      {mentorPhotos.slice(0, 4).map((p, i) => (
                        <img key={i} src={p} alt="" className="h-7 w-7 rounded-full border-2 border-background object-cover" />
                      ))}
                    </div>
                    <span>{stats.members.toLocaleString()}+ {t('members', 'member')}</span>
                  </div>
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <Star className="h-4 w-4 text-warning" />
                    <span>98% {t('satisfaction', 'puas')}</span>
                  </div>
                </div>
              </div>

              {/* Hero visual with match preview card — mcity style */}
              <div className="relative animate-scale-in">
                <div className="relative overflow-hidden rounded-2xl border border-border/40 transition-transform duration-500 hover:scale-[1.02]">
                  <img src={heroImg} alt="IT professional" className="h-[340px] w-full object-cover sm:h-[420px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-5 -right-3 hidden overflow-hidden rounded-xl border-2 border-background shadow-xl sm:block animate-float">
                  <img src={heroImg2} alt="Developer" className="h-28 w-28 object-cover" />
                </div>
                <div className="absolute -top-4 -left-4 hidden overflow-hidden rounded-xl border-2 border-background shadow-xl lg:block animate-float" style={{ animationDelay: '1.5s' }}>
                  <img src={heroImg3} alt="Developer" className="h-20 w-20 object-cover" />
                </div>
                {/* Match preview card */}
                <div className="absolute -bottom-8 left-2 hidden w-64 rounded-xl border border-border/50 bg-card/90 p-3 backdrop-blur-xl shadow-xl lg:block animate-fade-up" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">{t('Smart Matching', 'Match Cerdas')}</span>
                    <Badge variant="default" className="ml-auto text-[0.6rem] gap-0.5"><Zap className="h-2.5 w-2.5" /> 94%</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {matchPreviewJobs.slice(0, 2).map((job) => (
                      <div key={job.title} className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                        <div>
                          <div className="text-xs font-medium">{job.title}</div>
                          <div className="text-[0.65rem] text-muted-foreground">{job.company} · {job.location}</div>
                        </div>
                        <span className="text-xs font-bold text-primary">{job.match}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { en: 'Members', id: 'Member', val: stats.members, icon: Users },
                { en: 'Open Jobs', id: 'Lowongan', val: stats.jobs, icon: Briefcase },
                { en: 'Projects', id: 'Proyek', val: stats.projects, icon: Code2 },
                { en: 'Courses', id: 'Kursus', val: stats.courses, icon: GraduationCap },
              ].map((s, i) => (
                <div key={s.en} className={`glass glass-hover rounded-xl p-4 text-center stagger-${i + 1}`}>
                  <s.icon className="mx-auto mb-1.5 h-4 w-4 text-primary/70" />
                  <div className="text-2xl font-bold">{s.val.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{t(s.en, s.id)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="border-y border-border/30 bg-card/30 py-3 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, d) => (
              <div key={d} className="flex items-center gap-6 px-3">
                {['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'Kubernetes', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL', 'Supabase', 'Vercel'].map((tech) => (
                  <span key={tech} className="text-sm font-medium text-muted-foreground/40">{tech}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <Badge variant="secondary" className="mb-3 text-primary">{t('How It Works', 'Cara Kerja')}</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('Four steps to success', 'Empat langkah menuju sukses')}</h2>
              <p className="mt-2 text-muted-foreground">{t('From signing up to landing your first gig — it only takes a few minutes.', 'Dari daftar hingga dapat pekerjaan pertama — hanya butuh beberapa menit.')}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((step, i) => (
                <div key={step.en} className={`relative text-center stagger-${i + 1}`}>
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:shadow-lg hover:shadow-primary/20">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2 text-5xl font-bold text-primary/[0.06]">{i + 1}</div>
                  <h3 className="mb-1.5 font-semibold">{t(step.en, step.id)}</h3>
                  <p className="text-sm text-muted-foreground">{t(step.desc_en, step.desc_id)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SKILL CATEGORIES */}
        <section className="section-glow py-20 bg-card/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <Badge variant="secondary" className="mb-3 text-primary">{t('Skills', 'Skill')}</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('Explore by category', 'Jelajahi per kategori')}</h2>
              <p className="mt-2 text-muted-foreground">{t('11 specialized skill categories with verified sub-skills.', '11 kategori skill spesialis dengan sub-skill terverifikasi.')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {skillCategories.map((cat, i) => (
                <Link key={cat.en} href="/directory">
                  <div className={`group glass glass-hover flex items-center gap-3 rounded-xl p-4 stagger-${(i % 6) + 1}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                      <cat.icon className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium leading-tight">{t(cat.en, cat.id)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <Badge variant="secondary" className="mb-3 text-primary">{t('Platform', 'Platform')}</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('Everything in one place', 'Semua dalam satu tempat')}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div key={f.en} className={`glass glass-hover group rounded-xl p-5 stagger-${(i % 6) + 1}`}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <f.icon className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="mb-1 font-semibold">{t(f.en, f.id)}</h3>
                  <p className="text-sm text-muted-foreground">{t(f.desc_en, f.desc_id)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TALENT SHOWCASE — ADPList style */}
        <section className="section-glow py-20 bg-aurora">
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <Badge variant="secondary" className="mb-3 text-primary">{t('Talent', 'Talent')}</Badge>
                <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('Meet our talent', 'Kenalan dengan talent')}</h2>
              </div>
              <Link href="/talents" className="hidden sm:block">
                <Button variant="outline" size="sm" className="gap-2">{t('View all', 'Lihat semua')} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {talents.length > 0 ? talents.map((tal, i) => (
                <Link key={tal.id} href={`/talents/${tal.id}`}>
                  <Card className={`group h-full glass glass-hover stagger-${i + 1}`}>
                    <CardContent className="p-5">
                      <div className="mb-4 flex justify-center">
                        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border/60 transition-all group-hover:border-primary/40">
                          {tal.avatar_url ? (
                            <img src={tal.avatar_url} alt={tal.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-bold text-primary">
                              {tal.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold">{tal.full_name ?? 'Anonymous'}</h3>
                        <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {tal.location ?? 'Indonesia'}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/80">{tal.bio ?? 'IT professional'}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-1.5">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Star className="h-3 w-3 text-primary" /> Talent
                        </Badge>
                        {tal.linkedin_url && (
                          <Badge variant="secondary" className="text-xs">LinkedIn</Badge>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button size="sm" className="w-full gap-2">
                          <CalendarClock className="h-3.5 w-3.5" /> {t('Book session', 'Pesan sesi')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )) : (
                [...Array(4)].map((_, i) => (
                  <Card key={i} className={`glass glass-hover stagger-${i + 1}`}>
                    <CardContent className="p-5 text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                        {['R', 'S', 'A', 'M'][i]}
                      </div>
                      <h3 className="font-semibold">{['Rizky P.', 'Sarah W.', 'Aditya N.', 'Maya S.'][i]}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{['Backend Dev', 'Founder', 'Data Scientist', 'Product Designer'][i]}</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">{['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta'][i]}</p>
                      <div className="mt-4">
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <CalendarClock className="h-3.5 w-3.5" /> {t('Book session', 'Pesan sesi')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>

        {/* IMAGE BANNER */}
        <section className="py-8 bg-aurora">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-border/40 transition-transform duration-500 hover:scale-[1.01]">
              <img src="https://images.pexels.com/photos/8518816/pexels-photo-8518816.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Team collaboration" className="h-[200px] w-full object-cover sm:h-[300px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-sm px-6 sm:px-10">
                  <h3 className="font-display text-xl font-bold sm:text-2xl">{t('A community that gets it', 'Komunitas yang paham')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground/80">
                    {t('Built by people who lived the problem.', 'Dibuat oleh orang yang mengalami masalahnya.')}
                  </p>
                  <Link href="/register" className="mt-3 inline-block">
                    <Button size="sm" className="gap-2">{t('Join us', 'Gabung')} <ArrowRight className="h-3.5 w-3.5" /></Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <Badge variant="secondary" className="mb-3 text-primary">{t('Agency', 'Agency')}</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('Build with our team', 'Bangun bersama tim kami')}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s, i) => (
                <Card key={s.title} className={`group glass glass-hover stagger-${i + 1}`}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                      <s.icon className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>
                    <h3 className="mb-1 font-display text-base font-bold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{t(s.en, s.id)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* GALLERY */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <Badge variant="secondary" className="mb-3 text-primary">{t('Community', 'Komunitas')}</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('Real people, real work', 'Orang nyata, kerja nyata')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {galleryImages.map((img, i) => (
                <div key={i} className={`group relative overflow-hidden rounded-xl border border-border/40 transition-all duration-300 hover:border-primary/30 ${i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
                  <img src={img.url} alt={t(img.en, img.id)} className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${i === 0 ? 'h-56 lg:h-full' : 'h-28 sm:h-40'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-3 left-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
                    <span className="text-xs font-medium text-foreground/90">{t(img.en, img.id)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <Badge variant="secondary" className="mb-3 text-primary">{t('Stories', 'Cerita')}</Badge>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('From our community', 'Dari komunitas kami')}</h2>
            </div>
            <div className="glass-strong rounded-2xl p-8 sm:p-10">
              <Quote className="mb-4 h-8 w-8 text-primary/30" />
              <blockquote key={activeT} className="animate-fade-up text-lg leading-relaxed">
                {lang === 'id' ? testimonials[activeT].text_id : testimonials[activeT].text_en}
              </blockquote>
              <div className="mt-5 flex items-center gap-3">
                <img src={testimonials[activeT].photo} alt={testimonials[activeT].author} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <div className="font-medium">{testimonials[activeT].author}</div>
                  <div className="text-sm text-muted-foreground">{testimonials[activeT].role}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button onClick={() => setActiveT((p) => (p - 1 + testimonials.length) % testimonials.length)} className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 transition-colors hover:bg-muted" aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setActiveT(i)} className={`h-2 rounded-full transition-all ${i === activeT ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/40'}`} aria-label={`Story ${i + 1}`} />
                ))}
              </div>
              <button onClick={() => setActiveT((p) => (p + 1) % testimonials.length)} className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 transition-colors hover:bg-muted" aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* LIVE ACTIVITY FEED */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="glass-strong rounded-2xl p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse-soft" />
                <h3 className="font-display text-lg font-bold">{t('Live Activity', 'Aktivitas Terkini')}</h3>
                <Badge variant="secondary" className="ml-auto gap-1 text-xs">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" /> {t('Live', 'Langsung')}
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-4 transition-all hover:border-primary/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {[Briefcase, Users, Code2, Star][i] && (() => {
                        const Icon = [Briefcase, Users, Code2, Star][i];
                        return <Icon className="h-5 w-5 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <div className="text-xl font-bold">{a.count}</div>
                      <div className="text-xs text-muted-foreground">{t(a.label_en, a.label_id)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Card className="glass overflow-hidden border-primary/20 glow-primary">
              <CardContent className="relative p-8 lg:p-12">
                <div className="absolute right-0 top-0 h-[250px] w-[350px] rounded-full bg-primary/[0.05] blur-[100px]" />
                <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('Ready to join?', 'Siap bergabung?')}</h2>
                    <p className="mt-3 text-muted-foreground">
                      {t('Whether you\'re hiring, offering services, or growing your career — we\'re here.', 'Baik merekrut, menawarkan layanan, atau mengembangkan karier — kami di sini.')}
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link href="/register">
                        <Button size="lg" className="gap-2 glow-primary">{t('Join now', 'Gabung sekarang')} <ArrowRight className="h-4 w-4" /></Button>
                      </Link>
                      <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer">
                        <Button size="lg" variant="outline" className="gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
                      </a>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <a href="https://calendly.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border/50 p-3.5 transition-all hover:border-primary/30 hover:bg-muted/40">
                      <CalendarClock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">{t('Schedule a call', 'Jadwalkan panggilan')}</div>
                        <div className="text-xs text-muted-foreground">Calendly</div>
                      </div>
                    </a>
                    <a href="mailto:hello@masmasit.online" className="flex items-center gap-3 rounded-lg border border-border/50 p-3.5 transition-all hover:border-primary/30 hover:bg-muted/40">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">{t('Email us', 'Kirim email')}</div>
                        <div className="text-xs text-muted-foreground">hello@masmasit.online</div>
                      </div>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
