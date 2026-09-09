'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Search, BookOpen, Briefcase, FolderGit2, Users,
  GraduationCap, CalendarDays, Wrench, MessagesSquare, Bookmark, Eye,
  MapPin, Clock, Star, Circle, Plus,
  UserPlus, Compass, Handshake, Sprout, Code2, Brain, Palette, Cloud,
  Shield, Bug, UsersRound, Megaphone, Blocks, TrendingUp, Quote,
  ChevronLeft, ChevronRight, Activity, MessageCircle, Mail, CalendarClock,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { PageDecor } from '@/components/page-decor';
import { useLang } from '@/components/language-provider';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';

const px = (id: string, w: number, h: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=${h}&w=${w}`;

const heroImage = px('7652188', 1200, 900);
const ctaImage = px('8518816', 1600, 700);

/* ---------------------------------------------------------------- content */

const ecosystem = [
  { key: 'resources', href: null, icon: BookOpen, en: 'Resources', id: 'Resource', descEn: 'Guides, tools, documentation, templates, repositories, references.', descId: 'Panduan, tools, dokumentasi, template, repository, referensi.' },
  { key: 'jobs', href: '/jobs', icon: Briefcase, en: 'Jobs', id: 'Lowongan', descEn: 'Full-time, contract, freelance, remote and onsite opportunities.', descId: 'Full-time, kontrak, freelance, remote dan onsite.' },
  { key: 'projects', href: '/projects', icon: FolderGit2, en: 'Projects', id: 'Proyek', descEn: 'Real projects posted by companies, founders, and individuals.', descId: 'Proyek nyata dari perusahaan, founder, dan individu.' },
  { key: 'talents', href: '/talents', icon: Users, en: 'Talents', id: 'Talent', descEn: 'Discover Indonesian IT professionals by skills and experience.', descId: 'Temukan praktisi IT Indonesia berdasarkan skill dan pengalaman.' },
  { key: 'learn', href: '/courses', icon: GraduationCap, en: 'Learn', id: 'Belajar', descEn: 'Courses, tutorials, workshops, mentoring, and certifications.', descId: 'Kursus, tutorial, workshop, mentoring, dan sertifikasi.' },
  { key: 'events', href: '/events', icon: CalendarDays, en: 'Events', id: 'Event', descEn: 'Meetups, conferences, workshops, hackathons, and tech events.', descId: 'Meetup, konferensi, workshop, hackathon, dan acara teknologi.' },
  { key: 'services', href: '/services', icon: Wrench, en: 'Services', id: 'Layanan', descEn: 'Professional IT services offered by agencies and practitioners.', descId: 'Layanan IT profesional dari agency dan praktisi.' },
  { key: 'community', href: null, icon: MessagesSquare, en: 'Community', id: 'Komunitas', descEn: 'Discussions, knowledge sharing, networking, and collaboration.', descId: 'Diskusi, berbagi pengetahuan, networking, dan kolaborasi.' },
];

const trendingResources = [
  { title: 'System Design Interview Guide', cat: 'Software Engineering', level: 'Intermediate', views: '12.4K', saves: '2.1K', updated: '2d' },
  { title: 'Golang Concurrency Patterns', cat: 'Backend', level: 'Advanced', views: '9.8K', saves: '1.7K', updated: '4d' },
  { title: 'Next.js App Router Playbook', cat: 'Frontend', level: 'Intermediate', views: '8.6K', saves: '1.5K', updated: '1w' },
  { title: 'Kubernetes untuk Tim Kecil', cat: 'DevOps', level: 'Intermediate', views: '7.2K', saves: '1.3K', updated: '1w' },
  { title: 'Benchmark Gaji Developer Indonesia 2026', cat: 'Career', level: 'Beginner', views: '24.1K', saves: '5.9K', updated: '3d' },
  { title: 'Prompt Engineering & LLM Ops', cat: 'Data & AI', level: 'Advanced', views: '6.4K', saves: '1.1K', updated: '5d' },
];

const opportunityTabs = ['jobs', 'projects', 'freelance', 'internships'] as const;
type OpportunityTab = (typeof opportunityTabs)[number];

const opportunities: Record<OpportunityTab, {
  role: string; company: string; location: string; setup: string;
  type: string; level: string; stack: string[]; pay: string; posted: string;
}[]> = {
  jobs: [
    { role: 'Senior Fullstack Engineer', company: 'PT Kirana Teknologi', location: 'Jakarta', setup: 'Remote', type: 'Full-time', level: 'Senior', stack: ['React', 'Node.js', 'PostgreSQL', 'AWS'], pay: 'Rp 20–30jt', posted: '2 jam lalu' },
    { role: 'Backend Engineer (Go)', company: 'Payungi', location: 'Bandung', setup: 'Hybrid', type: 'Full-time', level: 'Mid', stack: ['Go', 'gRPC', 'PostgreSQL'], pay: 'Rp 15–24jt', posted: '5 jam lalu' },
    { role: 'Data Engineer', company: 'Semesta Analytics', location: 'Surabaya', setup: 'Onsite', type: 'Full-time', level: 'Mid', stack: ['Python', 'Airflow', 'BigQuery'], pay: 'Rp 14–22jt', posted: '1 hari lalu' },
    { role: 'Product Designer', company: 'Warung Digital', location: 'Yogyakarta', setup: 'Remote', type: 'Full-time', level: 'Mid', stack: ['Figma', 'Design System'], pay: 'Rp 12–18jt', posted: '1 hari lalu' },
  ],
  projects: [
    { role: 'Payment Infrastructure Revamp', company: 'Koperasi Nusantara', location: 'Jakarta', setup: 'Remote', type: 'Project', level: 'Senior', stack: ['Go', 'Kafka', 'PostgreSQL'], pay: 'Rp 85–120jt', posted: '6 jam lalu' },
    { role: 'Company Profile + CMS', company: 'CV Adiwangsa', location: 'Semarang', setup: 'Remote', type: 'Project', level: 'Mid', stack: ['Next.js', 'Sanity'], pay: 'Rp 25–40jt', posted: '1 hari lalu' },
    { role: 'Dashboard Analitik Retail', company: 'Toko Sinar Jaya', location: 'Medan', setup: 'Hybrid', type: 'Project', level: 'Mid', stack: ['React', 'Metabase'], pay: 'Rp 35–55jt', posted: '2 hari lalu' },
  ],
  freelance: [
    { role: 'Flutter Developer', company: 'Bali Trip Co', location: 'Bali', setup: 'Remote', type: 'Freelance', level: 'Mid', stack: ['Flutter', 'Firebase'], pay: 'Rp 9jt / bulan', posted: '3 jam lalu' },
    { role: 'DevOps Consultant', company: 'PT Anugerah Logistik', location: 'Jakarta', setup: 'Remote', type: 'Freelance', level: 'Senior', stack: ['Kubernetes', 'Terraform'], pay: 'Rp 1,2jt / hari', posted: '8 jam lalu' },
    { role: 'Technical Writer', company: 'Belajar Koding', location: 'Remote', setup: 'Remote', type: 'Freelance', level: 'Junior', stack: ['Docs', 'Markdown'], pay: 'Rp 350rb / artikel', posted: '1 hari lalu' },
  ],
  internships: [
    { role: 'Frontend Intern', company: 'Ruang Belajar', location: 'Bandung', setup: 'Hybrid', type: 'Internship', level: 'Student', stack: ['React', 'TypeScript'], pay: 'Rp 2–3,5jt', posted: '4 jam lalu' },
    { role: 'QA Intern', company: 'PT Solusi Data', location: 'Jakarta', setup: 'Onsite', type: 'Internship', level: 'Student', stack: ['Playwright', 'Manual QA'], pay: 'Rp 2jt', posted: '2 hari lalu' },
  ],
};

const demoTalents = [
  { id: 'd1', full_name: 'Rizky Pratama', role: 'Senior Backend Engineer', location: 'Jakarta', skills: ['Go', 'PostgreSQL', 'Kubernetes', 'AWS'], years: 8, available: true, avatar_url: px('220453', 200, 200) as string | null },
  { id: 'd2', full_name: 'Sarah Widodo', role: 'Product Designer', location: 'Bandung', skills: ['Figma', 'Design System', 'Research'], years: 6, available: true, avatar_url: px('774909', 200, 200) as string | null },
  { id: 'd3', full_name: 'Aditya Nugroho', role: 'Data Scientist', location: 'Surabaya', skills: ['Python', 'PyTorch', 'BigQuery'], years: 5, available: false, avatar_url: px('1681010', 200, 200) as string | null },
  { id: 'd4', full_name: 'Maya Santoso', role: 'DevOps Engineer', location: 'Yogyakarta', skills: ['Terraform', 'AWS', 'CI/CD'], years: 7, available: true, avatar_url: px('1130626', 200, 200) as string | null },
];

const learnCategories = ['Software Engineering', 'Data & AI', 'DevOps', 'Cybersecurity', 'UI/UX', 'Product', 'Career', 'Leadership'];

const courses = [
  { title: 'Backend Scalable dengan Go', instructor: 'Rizky Pratama', level: 'Intermediate', duration: '8j 40m', rating: 4.8, learners: '1.2K', thumb: px('270404', 240, 160) },
  { title: 'Design System dari Nol', instructor: 'Sarah Widodo', level: 'Beginner', duration: '5j 10m', rating: 4.9, learners: '2.4K', thumb: px('1966452', 240, 160) },
  { title: 'MLOps untuk Data Scientist', instructor: 'Aditya Nugroho', level: 'Advanced', duration: '11j 05m', rating: 4.7, learners: '860', thumb: px('8386440', 240, 160) },
];

const activity = [
  { kind: 'discussion', en: 'New discussion', id: 'Diskusi baru', text: 'Best approach for structuring a large Next.js application?', meta: 'Frontend · 24 balasan', time: '12m' },
  { kind: 'resource', en: 'New resource', id: 'Resource baru', text: 'Indonesian Developer Salary Benchmark 2026', meta: 'Career · 5.9K saves', time: '1j' },
  { kind: 'project', en: 'New project', id: 'Proyek baru', text: 'Need a backend engineer for payment infrastructure', meta: 'Jakarta · Rp 85–120jt', time: '3j' },
  { kind: 'event', en: 'New event', id: 'Event baru', text: 'Jakarta Cloud Native Meetup', meta: '18 Sep · 240 peserta', time: '5j' },
  { kind: 'discussion', en: 'New discussion', id: 'Diskusi baru', text: 'Pengalaman migrasi monolith ke microservices di tim kecil', meta: 'Backend · 41 balasan', time: '7j' },
];

const events = [
  { day: '18', month: 'Sep', title: 'Jakarta Cloud Native Meetup', org: 'CNCF Jakarta', place: 'Jakarta · Onsite', cat: 'Meetup', attendees: 240, thumb: px('7643736', 320, 200) },
  { day: '24', month: 'Sep', title: 'Hackathon Fintech Nusantara', org: 'Fintech ID', place: 'Bandung · Onsite', cat: 'Hackathon', attendees: 512, thumb: px('17724731', 320, 200) },
  { day: '02', month: 'Okt', title: 'Workshop: Observability 101', org: 'DevOps Indonesia', place: 'Online', cat: 'Workshop', attendees: 890, thumb: px('9301872', 320, 200) },
  { day: '11', month: 'Okt', title: 'UI/UX Conference Surabaya', org: 'Designudy', place: 'Surabaya · Onsite', cat: 'Conference', attendees: 320, thumb: px('8761524', 320, 200) },
];

const serviceCategories = [
  'Software Development', 'UI/UX Design', 'AI Development', 'Cloud & DevOps',
  'Cybersecurity', 'Data Engineering', 'Digital Product Development', 'IT Consulting',
];

const scattered = [
  { tool: 'LinkedIn', forWhat: { en: 'networking', id: 'networking' } },
  { tool: 'Job portals', forWhat: { en: 'jobs', id: 'lowongan' } },
  { tool: 'GitHub', forWhat: { en: 'code', id: 'kode' } },
  { tool: 'Discord / Telegram', forWhat: { en: 'communities', id: 'komunitas' } },
  { tool: 'YouTube', forWhat: { en: 'learning', id: 'belajar' } },
  { tool: 'Event platforms', forWhat: { en: 'meetups', id: 'meetup' } },
  { tool: 'Freelance marketplaces', forWhat: { en: 'projects', id: 'proyek' } },
];

const galleryImages = [
  { id: '7652188', en: 'Team collaboration', idn: 'Kolaborasi tim' },
  { id: '8101931', en: 'Deep work', idn: 'Fokus mendalam' },
  { id: '8761524', en: 'Conference', idn: 'Konferensi' },
  { id: '17724731', en: 'Brainstorm sessions', idn: 'Sesi brainstorm' },
  { id: '9301872', en: 'Creative workshop', idn: 'Workshop kreatif' },
  { id: '7643736', en: 'Community meetup', idn: 'Meetup komunitas' },
  { id: '10375906', en: 'Diverse teams', idn: 'Tim beragam' },
  { id: '8518816', en: 'Shipping together', idn: 'Shipping bersama' },
  { id: '7534107', en: 'Mentoring session', idn: 'Sesi mentoring' },
];

const liveActivityLabels = [
  { icon: Briefcase, en: 'New jobs today', id: 'Lowongan baru hari ini' },
  { icon: Users, en: 'New members this week', id: 'Member baru minggu ini' },
  { icon: FolderGit2, en: 'New projects this week', id: 'Proyek baru minggu ini' },
  { icon: Star, en: 'Talent bookings this month', id: 'Booking talent bulan ini' },
];

const platformCounts = [
  { en: 'Members', id: 'Member' },
  { en: 'Open Jobs', id: 'Lowongan Terbuka' },
  { en: 'Projects', id: 'Proyek' },
  { en: 'Courses', id: 'Kursus' },
];

const howItWorks = [
  { icon: UserPlus, en: 'Create Profile', id: 'Buat Profil', descEn: 'Sign up, add your skills, experience, and portfolio.', descId: 'Daftar, tambahkan skill, pengalaman, dan portofolio.' },
  { icon: Compass, en: 'Explore', id: 'Jelajahi', descEn: 'Browse jobs, projects, talents, and courses.', descId: 'Jelajahi lowongan, proyek, talent, dan kursus.' },
  { icon: Handshake, en: 'Connect', id: 'Terhubung', descEn: 'Apply, bid, book sessions, or message members.', descId: 'Lamar, tawar, pesan sesi, atau chat member.' },
  { icon: Sprout, en: 'Grow', id: 'Tumbuh', descEn: 'Learn, earn, and advance your career.', descId: 'Belajar, hasilkan, dan kembangkan karier.' },
];

const skillCategories = [
  { icon: Code2, label: 'Software Engineering' },
  { icon: Brain, label: 'Data & AI' },
  { icon: Compass, label: 'Product Management' },
  { icon: Palette, label: 'UI/UX & Creative' },
  { icon: Cloud, label: 'DevOps & Infrastructure' },
  { icon: Shield, label: 'Cybersecurity' },
  { icon: Bug, label: 'QA & Testing' },
  { icon: UsersRound, label: 'HR & People' },
  { icon: Megaphone, label: 'Digital Marketing & Growth' },
  { icon: Blocks, label: 'No-Code/Low-Code' },
  { icon: Handshake, label: 'Sales & Business Development' },
];

const platformFeatures = [
  { icon: Users, href: '/directory', en: 'Member Directory', id: 'Direktori Member', descEn: 'Find IT practitioners by skill & location.', descId: 'Cari praktisi IT berdasarkan skill & lokasi.' },
  { icon: Briefcase, href: '/jobs', en: 'Job Portal', id: 'Job Portal', descEn: 'Post jobs, apply with one click.', descId: 'Pasang lowongan, lamar sekali klik.' },
  { icon: FolderGit2, href: '/projects', en: 'Project Portal', id: 'Project Portal', descEn: 'Post projects, receive bids, hire.', descId: 'Pasang proyek, terima penawaran, rekrut.' },
  { icon: GraduationCap, href: '/courses', en: 'LMS + Coaching', id: 'LMS + Coaching', descEn: 'Courses with quizzes & certificates.', descId: 'Kursus dengan kuis & sertifikat.' },
  { icon: CalendarDays, href: '/events', en: 'Events', id: 'Event', descEn: 'Meetups, workshops & hackathons.', descId: 'Meetup, workshop & hackathon.' },
  { icon: TrendingUp, href: '/services', en: 'Agency Services', id: 'Layanan Agency', descEn: 'End-to-end digital product delivery.', descId: 'Pengiriman produk digital end-to-end.' },
];

const agencyServices = [
  { icon: Code2, title: 'SaaS', en: 'Product & cloud platforms', id: 'Produk & platform cloud' },
  { icon: Brain, title: 'AI', en: 'Chatbots, ML & data pipelines', id: 'Chatbot, ML & data pipeline' },
  { icon: Palette, title: 'Creative', en: 'Design, brand & UI kits', id: 'Desain, brand & UI kit' },
  { icon: UsersRound, title: 'HR', en: 'Recruitment & HRIS', id: 'Rekrutmen & HRIS' },
];

const testimonials = [
  { textEn: 'Every interaction feels intentional. This platform gave me clarity I’d been searching for.', textId: 'Setiap interaksi terasa intentional. Platform ini memberi kejelasan yang saya cari.', author: 'Rizky Pratama', role: 'Backend Dev · Jakarta', photo: px('5308640', 200, 200) },
  { textEn: 'It goes beyond functionality — it offers direction. The authenticity is unmatched.', textId: 'Melampaui fungsionalitas — ia memberi arah. Keasliannya tak tertandingi.', author: 'Sarah Wijaya', role: 'Founder · Bandung', photo: px('7752820', 200, 200) },
  { textEn: 'Simple and deep. I could focus on meaningful outcomes, not processes.', textId: 'Simpel dan mendalam. Saya bisa fokus pada hasil, bukan proses.', author: 'Aditya Nugroho', role: 'Data Scientist · Surabaya', photo: px('6942776', 200, 200) },
  { textEn: 'It doesn’t overwhelm, yet delivers depth where it matters. Professional and personal.', textId: 'Tidak berlebihan, tapi memberi kedalaman di tempat penting. Profesional dan personal.', author: 'Maya Sari', role: 'Product Designer · Yogya', photo: px('15014092', 200, 200) },
  { textEn: 'I hired two engineers here in under a week. The profiles actually show the work, not just job titles.', textId: 'Saya merekrut dua engineer di sini kurang dari seminggu. Profilnya menunjukkan karya, bukan sekadar jabatan.', author: 'Bayu Prakoso', role: 'CTO · PT Kirana Teknologi', photo: px('749091', 200, 200) },
  { textEn: 'The courses and the community feed keep me current without ten tabs open all day.', textId: 'Kursus dan feed komunitasnya bikin saya tetap update tanpa buka sepuluh tab seharian.', author: 'Nadia Rahmawati', role: 'DevOps Engineer · Semarang', photo: px('7534107', 200, 200) },
];

/* -------------------------------------------------------------- components */

function SectionHead({ eyebrow, title, desc, href, cta }: {
  eyebrow: string; title: string; desc?: string; href?: string; cta?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {desc && <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>}
      </div>
      {href && cta && (
        <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex">
          {cta} <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-border px-1.5 py-0.5 text-[11px] leading-4 text-muted-foreground">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------- page */

export default function HomePage() {
  const { t } = useLang();
  const [tab, setTab] = useState<OpportunityTab>('jobs');
  const [talents, setTalents] = useState(demoTalents);
  const [live, setLive] = useState<number[]>([0, 0, 0, 0]);
  const [totals, setTotals] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, location')
        .eq('is_talent', true)
        .eq('talent_approved', 'approved')
        .limit(4);
      if (data && data.length > 0) {
        setTalents(
          data.map((p: Record<string, unknown>, i) => ({
            id: String(p.id),
            full_name: (p.full_name as string) ?? demoTalents[i % 4].full_name,
            role: (p.bio as string)?.slice(0, 40) ?? demoTalents[i % 4].role,
            location: (p.location as string) ?? demoTalents[i % 4].location,
            skills: demoTalents[i % 4].skills,
            years: demoTalents[i % 4].years,
            available: true,
            avatar_url: (p.avatar_url as string) ?? null,
          }))
        );
      }
    })();
  }, []);

  /* Live counters — real rows, counted head-only so nothing is downloaded. */
  useEffect(() => {
    (async () => {
      const now = new Date();
      const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const count = async (table: string, since: Date) => {
        const { count: n } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', since.toISOString());
        return n ?? 0;
      };

      const results = await Promise.all([
        count('jobs', startOfDay),
        count('profiles', weekAgo),
        count('projects', weekAgo),
        count('bookings', startOfMonth),
      ]).catch(() => null);

      if (results) setLive(results);

      const total = async (table: string, filter?: [string, string]) => {
        let q = supabase.from(table).select('*', { count: 'exact', head: true });
        if (filter) q = q.eq(filter[0], filter[1]);
        const { count: n } = await q;
        return n ?? 0;
      };

      const totalResults = await Promise.all([
        total('profiles'),
        total('jobs', ['status', 'open']),
        total('projects', ['status', 'open']),
        total('courses'),
      ]).catch(() => null);

      if (totalResults) setTotals(totalResults);
    })();
  }, []);

  const rows = opportunities[tab];

  /* Stories slider: scrolls by one card, one row on every breakpoint. */
  const storiesRef = useRef<HTMLDivElement>(null);
  const slideStories = (dir: 1 | -1) => {
    const el = storiesRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <AppShell>
      <PageDecor>
        {/* 1 ── HERO ------------------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-border">

          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14 lg:px-8">
            <div>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {t("Indonesia's IT ecosystem, in one place.", 'Ekosistem IT Indonesia, dalam satu tempat.')}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
                {t(
                  'Discover resources, opportunities, talent, learning, projects, and communities built for Indonesian IT professionals.',
                  'Temukan resource, peluang, talent, materi belajar, proyek, dan komunitas untuk praktisi IT Indonesia.'
                )}
              </p>

              {/* Global search — the platform is searchable end to end */}
              <div className="mt-8 max-w-2xl">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors focus-within:border-muted-foreground/40">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder={t('Search jobs, projects, people, courses, resources…', 'Cari lowongan, proyek, orang, kursus, resource…')}
                  />
                  <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground sm:block">⌘K</kbd>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    {t('Join Community', 'Gabung Komunitas')} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/talents">
                  <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                    <Star className="h-4 w-4" /> {t('Find Talent', 'Cari Talent')}
                  </Button>
                </Link>
              </div>

              {/* Trust line — member count and satisfaction. */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    {demoTalents.map((m) => (
                      <img
                        key={m.id}
                        src={m.avatar_url ?? ''}
                        alt=""
                        loading="lazy"
                        className="h-7 w-7 rounded-full border-2 border-background object-cover"
                      />
                    ))}
                  </div>
                  <span>
                    <span className="tnum">{totals[0].toLocaleString('id-ID')}</span>+ {t('members', 'member')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span><span className="tnum">98%</span> {t('satisfaction', 'puas')}</span>
                </div>
              </div>
            </div>

            {/* Visual asset — framed, scrimmed so it sits in the dark surface. */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={heroImage}
                  alt={t('Indonesian IT practitioners collaborating', 'Praktisi IT Indonesia berkolaborasi')}
                  loading="lazy"
                  className="h-[220px] w-full object-cover sm:h-[300px] lg:h-[380px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Circle className="h-1.5 w-1.5 animate-pulse-soft fill-primary text-primary" />
                    <span className="tnum">248</span> {t('online now', 'sedang online')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <span className="tnum">36</span> {t('new opportunities today', 'peluang baru hari ini')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10 ── STATISTICS (moved up: credibility before the tour) --------- */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            {platformCounts.map((s, i) => (
              <div
                key={s.en}
                className={`py-7 ${i % 2 === 1 ? 'border-l border-border pl-6' : ''} ${i >= 2 ? 'border-t border-border lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:pl-6' : ''} ${i === 3 ? 'lg:pl-6' : ''}`}
              >
                <div className="tnum font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {totals[i].toLocaleString('id-ID')}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{t(s.en, s.id)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 2 ── EXPLORE THE ECOSYSTEM -------------------------------------- */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Ecosystem', 'Ekosistem')}
              title={t('Everything an Indonesian IT professional needs', 'Semua yang dibutuhkan praktisi IT Indonesia')}
              desc={t('Eight connected areas, one account. Start anywhere.', 'Delapan area yang saling terhubung, satu akun. Mulai dari mana saja.')}
            />

            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-6">
              {ecosystem.map((e, i) => {
                const lead = i < 2;
                const span = lead ? 'sm:col-span-2 lg:col-span-3' : 'lg:col-span-2';
                const inner = (
                  <div className={`group flex h-full flex-col bg-card transition-colors hover:bg-secondary ${lead ? 'p-6' : 'p-5'}`}>
                    <e.icon className={`text-primary ${lead ? 'h-6 w-6' : 'h-5 w-5'}`} strokeWidth={1.75} />
                    <div className={`mt-4 flex items-center gap-1.5 font-medium ${lead ? 'text-lg' : 'text-sm'}`}>
                      {t(e.en, e.id)}
                      {e.href && <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />}
                      {!e.href && <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">{t('soon', 'segera')}</span>}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t(e.descEn, e.descId)}
                    </p>
                  </div>
                );
                return e.href
                  ? <Link key={e.key} href={e.href} className={span}>{inner}</Link>
                  : <div key={e.key} className={span}>{inner}</div>;
              })}
            </div>
          </div>
        </section>

        {/* 2b ── HOW IT WORKS ---------------------------------------------- */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('How It Works', 'Cara Kerja')}
              title={t('Four steps to success', 'Empat langkah menuju sukses')}
              desc={t(
                'From signing up to landing your first gig — it only takes a few minutes.',
                'Dari mendaftar sampai dapat pekerjaan pertama — hanya butuh beberapa menit.'
              )}
            />

            <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((s, i) => (
                <li key={s.en} className="flex h-full flex-col bg-card p-5">
                  <div className="flex items-center gap-3">
                    <s.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                    <span className="text-sm font-medium">{t(s.en, s.id)}</span>
                    <span className="tnum ml-auto text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.descEn, s.descId)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3 ── TRENDING RESOURCES ----------------------------------------- */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Resources', 'Resource')}
              title={t('What the community is reading', 'Yang sedang dibaca komunitas')}
              desc={t('Guides, references and tools saved most this week.', 'Panduan, referensi dan tools yang paling banyak disimpan minggu ini.')}
              href="/directory" cta={t('All resources', 'Semua resource')}
            />

            <div className="overflow-hidden rounded-lg border border-border">
              {trendingResources.map((r, i) => (
                <div
                  key={r.title}
                  className={`group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <span className="tnum w-5 shrink-0 text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.cat} · {r.level}</p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-4 sm:flex">
                    <Meta><span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{r.views}</span></Meta>
                    <Meta><span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" />{r.saves}</span></Meta>
                    <Meta>{r.updated}</Meta>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 ── LATEST OPPORTUNITIES --------------------------------------- */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Opportunities', 'Peluang')}
              title={t('Latest opportunities', 'Peluang terbaru')}
              href="/jobs" cta={t('Browse all', 'Lihat semua')}
            />

            <div className="mb-4 flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
              {opportunityTabs.map((tb) => (
                <button
                  key={tb}
                  role="tab"
                  aria-selected={tab === tb}
                  onClick={() => setTab(tb)}
                  className={`shrink-0 rounded px-3 py-1.5 text-sm capitalize transition-colors ${tab === tb ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tb}
                  <span className="tnum ml-1.5 text-xs text-muted-foreground">{opportunities[tb].length}</span>
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              {rows.map((o, i) => (
                <div key={o.role} className={`group px-4 py-4 transition-colors hover:bg-secondary ${i > 0 ? 'border-t border-border' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{o.role}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{o.company}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tnum text-sm font-medium text-primary">{o.pay}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{o.posted}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Chip>{o.setup}</Chip>
                    <Chip>{o.type}</Chip>
                    <Chip>{o.level}</Chip>
                    <span className="mx-1 hidden h-3 w-px bg-border sm:block" />
                    {o.stack.map((s) => <Chip key={s}>{s}</Chip>)}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{o.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 ── TALENT DISCOVERY ------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Talent', 'Talent')}
              title={t('Discover people, not just profiles', 'Temukan orangnya, bukan sekadar profil')}
              desc={t('Filter by role, skill, experience, location and availability.', 'Saring berdasarkan peran, skill, pengalaman, lokasi dan ketersediaan.')}
              href="/talents" cta={t('Talent directory', 'Direktori talent')}
            />

            <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
              {talents.map((p) => (
                <Link
                  key={p.id}
                  href={`/talents/${p.id}`}
                  className="flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30 lg:w-auto lg:max-w-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-sm font-medium">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        : p.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.skills.slice(0, 4).map((s) => <Chip key={s}>{s}</Chip>)}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <Meta><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span></Meta>
                    <Meta>
                      <span className="inline-flex items-center gap-1.5">
                        <Circle className={`h-1.5 w-1.5 ${p.available ? 'fill-primary text-primary' : 'fill-muted-foreground text-muted-foreground'}`} />
                        {p.available ? t('Available', 'Tersedia') : t('Busy', 'Sibuk')}
                      </span>
                    </Meta>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5b ── SKILL CATEGORIES ------------------------------------------ */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Skills', 'Skill')}
              title={t('Explore by category', 'Jelajahi per kategori')}
              desc={t(
                '11 specialized skill categories with verified sub-skills.',
                '11 kategori skill spesialis dengan sub-skill terverifikasi.'
              )}
              href="/directory" cta={t('All categories', 'Semua kategori')}
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {skillCategories.map((c) => (
                <Link
                  key={c.label}
                  href="/directory"
                  className="group flex items-center gap-3 rounded-lg border border-border px-3.5 py-3 transition-colors hover:border-muted-foreground/30 hover:bg-secondary"
                >
                  <c.icon className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.75} />
                  <span className="text-sm leading-tight">{c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 6 ── LEARNING + 7 ── COMMUNITY ACTIVITY (two columns) ----------- */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-8">
            {/* Learning */}
            <div>
              <SectionHead
                eyebrow={t('Learn', 'Belajar')}
                title={t('Learning built by practitioners', 'Materi belajar dari praktisi')}
                href="/courses" cta={t('All courses', 'Semua kursus')}
              />
              <div className="mb-5 flex flex-wrap gap-1.5">
                {learnCategories.map((c) => (
                  <button key={c} className="rounded border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground">
                    {c}
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                {courses.map((c, i) => (
                  <div key={c.title} className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary ${i > 0 ? 'border-t border-border' : ''}`}>
                    <img
                      src={c.thumb}
                      alt=""
                      loading="lazy"
                      className="h-11 w-16 shrink-0 rounded border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.instructor} · {c.level}</p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-4 sm:flex">
                      <Meta><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{c.duration}</span></Meta>
                      <Meta><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current" />{c.rating}</span></Meta>
                      <Meta>{c.learners}</Meta>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community activity */}
            <div>
              <SectionHead
                eyebrow={t('Community', 'Komunitas')}
                title={t('Happening now', 'Sedang berlangsung')}
              />
              <div className="space-y-0">
                {activity.map((a, i) => (
                  <div key={a.text} className={`flex gap-3 py-3.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t(a.en, a.id)}</p>
                      <p className="mt-0.5 text-sm leading-snug">{a.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{a.meta}</p>
                    </div>
                    <Meta>{a.time}</Meta>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8 ── EVENTS ------------------------------------------------------ */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Events', 'Event')}
              title={t('Upcoming in the Indonesian tech scene', 'Akan datang di skena teknologi Indonesia')}
              href="/events" cta={t('All events', 'Semua event')}
            />
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {events.map((e) => (
                <div key={e.title} className="flex gap-4 bg-card p-5 transition-colors hover:bg-secondary">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-border">
                    <img src={e.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-background/55" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="tnum text-lg font-semibold leading-none">{e.day}</span>
                      <span className="mt-0.5 text-[11px] uppercase text-muted-foreground">{e.month}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.org} · {e.place}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Chip>{e.cat}</Chip>
                      <Meta><span className="tnum">{e.attendees}</span> {t('attending', 'peserta')}</Meta>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8c ── COMMUNITY GALLERY ------------------------------------------ */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Community', 'Komunitas')}
              title={t('Real people, real work', 'Orang nyata, kerja nyata')}
              desc={t(
                'Meetups, workshops and everyday collaboration across Indonesian tech.',
                'Meetup, workshop dan kolaborasi sehari-hari di dunia teknologi Indonesia.'
              )}
              href="/events" cta={t('See events', 'Lihat event')}
            />

            {/*
              9 tiles with the first one spanning 2x2 fills 12 cells exactly —
              so the grid stays flush at 2, 3 and 4 columns with no ragged row.
            */}
            <div className="grid auto-rows-[110px] grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:auto-rows-[130px] sm:grid-cols-3 lg:auto-rows-[150px] lg:grid-cols-4">
              {galleryImages.map((img, i) => (
                <figure
                  key={img.id}
                  className={`group relative overflow-hidden bg-card ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                >
                  <img
                    src={px(img.id, 800, 600)}
                    alt={t(img.en, img.idn)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/85 via-background/25 to-transparent"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 truncate px-3 pb-2.5 text-[11px] font-medium text-foreground/90">
                    {t(img.en, img.idn)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 8b ── PLATFORM FEATURES ----------------------------------------- */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Platform', 'Platform')}
              title={t('Everything in one place', 'Semua dalam satu tempat')}
            />

            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {platformFeatures.map((f) => (
                <Link key={f.en} href={f.href} className="group flex h-full flex-col bg-card p-5 transition-colors hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <f.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                    <span className="text-sm font-medium">{t(f.en, f.id)}</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.descEn, f.descId)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 9 ── SERVICES ---------------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Services', 'Layanan')}
              title={t('Hire agencies and independent practitioners', 'Sewa agency dan praktisi independen')}
              href="/services" cta={t('Browse services', 'Lihat layanan')}
            />
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((c) => (
                <Link
                  key={c}
                  href="/services"
                  className="group inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:border-muted-foreground/30 hover:bg-secondary"
                >
                  {c}
                  <Plus className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:rotate-90" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 9b ── AGENCY ----------------------------------------------------- */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Agency', 'Agency')}
              title={t('Build with our team', 'Bangun bersama tim kami')}
              href="/services" cta={t('Talk to us', 'Hubungi kami')}
            />

            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {agencyServices.map((s) => (
                <div key={s.title} className="flex h-full flex-col bg-card p-5">
                  <div className="flex items-center gap-3">
                    <s.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                    <span className="text-sm font-medium">{s.title}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.en, s.id)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11 ── WHY THIS PLATFORM ------------------------------------------ */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t('Why', 'Kenapa')}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {t('Seven tabs open, one career.', 'Tujuh tab terbuka, satu karier.')}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                {t(
                  'Indonesian IT professionals juggle a different platform for every need. Context, reputation and history stay scattered across all of them.',
                  'Praktisi IT Indonesia memakai platform berbeda untuk tiap kebutuhan. Konteks, reputasi dan riwayat tercecer di semuanya.'
                )}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                {t(
                  'masmasit brings those professional resources into one ecosystem — with a single profile that carries your work, skills and standing.',
                  'masmasit menyatukan resource profesional itu dalam satu ekosistem — dengan satu profil yang membawa karya, skill dan reputasimu.'
                )}
              </p>
            </div>

            <div className="rounded-lg border border-border">
              {scattered.map((s, i) => (
                <div key={s.tool} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <span className="text-sm text-muted-foreground line-through decoration-border">{s.tool}</span>
                  <span className="text-xs text-muted-foreground">{t(s.forWhat.en, s.forWhat.id)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border bg-secondary px-4 py-3.5">
                <span className="text-sm font-medium">masmasit</span>
                <span className="text-xs text-primary">{t('all of the above', 'semuanya di atas')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 11b ── TESTIMONIALS (slider) ------------------------------------- */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t('Stories', 'Cerita')}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t('From our community', 'Dari komunitas kami')}
                </h2>
              </div>
              <div className="hidden shrink-0 gap-2 sm:flex">
                <button
                  type="button"
                  aria-label={t('Previous stories', 'Cerita sebelumnya')}
                  onClick={() => slideStories(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-muted-foreground/30 hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t('More stories', 'Cerita berikutnya')}
                  onClick={() => slideStories(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-muted-foreground/30 hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={storiesRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1">
              {testimonials.map((q) => (
                <figure
                  key={q.author}
                  className="flex w-[85vw] max-w-[420px] shrink-0 snap-start flex-col rounded-lg border border-border bg-card p-6 sm:w-[400px]"
                >
                  <Quote className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  <blockquote className="mt-3 text-sm leading-relaxed text-pretty">
                    {t(q.textEn, q.textId)}
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 pt-5">
                    <img
                      src={q.photo}
                      alt=""
                      loading="lazy"
                      className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{q.author}</p>
                      <p className="truncate text-xs text-muted-foreground">{q.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 11c ── LIVE ACTIVITY --------------------------------------------- */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Circle className="h-1.5 w-1.5 animate-pulse-soft fill-primary text-primary" />
                {t('Live', 'Langsung')}
              </p>
              <h2 className="mt-2 flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                <Activity className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.75} />
                {t('Live Activity', 'Aktivitas Terkini')}
              </h2>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {liveActivityLabels.map((a, i) => (
              <div key={a.en} className="flex h-full flex-col bg-card p-5">
                <a.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                <div className="tnum mt-4 font-display text-3xl font-semibold tracking-tight">
                  {live[i].toLocaleString('id-ID')}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t(a.en, a.id)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 ── FINAL CTA -------------------------------------------------- */}
        <section className="relative overflow-hidden">
          <img
            src={ctaImage}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {t('Ready to join?', 'Siap bergabung?')}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
                  {t(
                    "Whether you're hiring, offering services, or growing your career — we're here.",
                    'Baik merekrut, menawarkan layanan, atau mengembangkan karier — kami di sini.'
                  )}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="w-full gap-2 sm:w-auto">
                      {t('Join now', 'Gabung sekarang')} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer">
                    <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </Button>
                  </a>
                </div>
              </div>

              <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border">
                <a
                  href="https://calendly.com"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 bg-card p-4 transition-colors hover:bg-secondary"
                >
                  <CalendarClock className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{t('Schedule a call', 'Jadwalkan panggilan')}</div>
                    <div className="truncate text-xs text-muted-foreground">Calendly</div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
                <a
                  href="mailto:hello@masmasit.online"
                  className="group flex items-center gap-3 bg-card p-4 transition-colors hover:bg-secondary"
                >
                  <Mail className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{t('Email us', 'Kirim email')}</div>
                    <div className="truncate text-xs text-muted-foreground">hello@masmasit.online</div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </PageDecor>
    </AppShell>
  );
}
