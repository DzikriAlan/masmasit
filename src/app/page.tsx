'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageDecor } from '@/components/page-decor';
import { useLang } from '@/components/language-provider';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import heroBackground from '@/shared/images/backgroundhero2.png';

const px = (id: string, w: number, h: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=${h}&w=${w}`;

const CONTACT_EMAIL = 'hello@masmasit.online';

/* Identity colour per ecosystem area (tokens in globals.css). Full class
   strings live here so Tailwind can see them. */
const tones = {
  blue: { text: 'text-eco-blue', soft: 'bg-eco-blue/10', fill: 'bg-eco-blue', hover: 'hover:border-eco-blue/45', bar: 'border-eco-blue bg-eco-blue/15', chip: 'border-eco-blue/25 bg-eco-blue/10', cssVar: '--eco-blue', wash: 'wash wash-blue' },
  violet: { text: 'text-eco-violet', soft: 'bg-eco-violet/10', fill: 'bg-eco-violet', hover: 'hover:border-eco-violet/45', bar: 'border-eco-violet bg-eco-violet/15', chip: 'border-eco-violet/25 bg-eco-violet/10', cssVar: '--eco-violet', wash: 'wash wash-violet' },
  orange: { text: 'text-eco-orange', soft: 'bg-eco-orange/10', fill: 'bg-eco-orange', hover: 'hover:border-eco-orange/45', bar: 'border-eco-orange bg-eco-orange/15', chip: 'border-eco-orange/25 bg-eco-orange/10', cssVar: '--eco-orange', wash: 'wash wash-orange' },
  teal: { text: 'text-eco-teal', soft: 'bg-eco-teal/10', fill: 'bg-eco-teal', hover: 'hover:border-eco-teal/45', bar: 'border-eco-teal bg-eco-teal/15', chip: 'border-eco-teal/25 bg-eco-teal/10', cssVar: '--eco-teal', wash: 'wash wash-teal' },
  pink: { text: 'text-eco-pink', soft: 'bg-eco-pink/10', fill: 'bg-eco-pink', hover: 'hover:border-eco-pink/45', bar: 'border-eco-pink bg-eco-pink/15', chip: 'border-eco-pink/25 bg-eco-pink/10', cssVar: '--eco-pink', wash: 'wash wash-pink' },
  amber: { text: 'text-eco-amber', soft: 'bg-eco-amber/10', fill: 'bg-eco-amber', hover: 'hover:border-eco-amber/45', bar: 'border-eco-amber bg-eco-amber/15', chip: 'border-eco-amber/25 bg-eco-amber/10', cssVar: '--eco-amber', wash: 'wash wash-amber' },
  green: { text: 'text-eco-green', soft: 'bg-eco-green/10', fill: 'bg-eco-green', hover: 'hover:border-eco-green/45', bar: 'border-eco-green bg-eco-green/15', chip: 'border-eco-green/25 bg-eco-green/10', cssVar: '--eco-green', wash: 'wash wash-green' },
} as const;
type Tone = keyof typeof tones;

/* Organisation monogram used where a logo/icon would otherwise go. */
const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();


/* ---------------------------------------------------------------- content */

const ecosystem = [
  { key: 'jobs', tone: 'blue' as Tone, href: '/jobs', en: 'Jobs', id: 'Lowongan', leadEn: 'Find your next role,', leadId: 'Temukan peran berikutnya,', boldEn: 'full-time or freelance.', boldId: 'full-time atau freelance.' },
  { key: 'projects', tone: 'violet' as Tone, href: '/projects', en: 'Projects', id: 'Proyek', leadEn: 'Real projects,', leadId: 'Proyek nyata,', boldEn: 'posted by real companies.', boldId: 'dari perusahaan sungguhan.' },
  { key: 'talents', tone: 'orange' as Tone, href: '/talents', en: 'Talents', id: 'Talent', leadEn: 'Discover IT professionals,', leadId: 'Temukan praktisi IT,', boldEn: 'vetted and ready.', boldId: 'terverifikasi dan siap.' },
  { key: 'learn', tone: 'teal' as Tone, href: '/courses', en: 'Learn', id: 'Belajar', leadEn: 'Courses and workshops,', leadId: 'Kursus dan workshop,', boldEn: 'built by practitioners.', boldId: 'dibuat oleh praktisi.' },
  { key: 'events', tone: 'pink' as Tone, href: '/events', en: 'Events', id: 'Event', leadEn: 'Meetups and hackathons,', leadId: 'Meetup dan hackathon,', boldEn: 'happening near you.', boldId: 'di dekatmu.' },
  { key: 'services', tone: 'amber' as Tone, href: '/services', en: 'Services', id: 'Layanan', leadEn: 'Professional IT services,', leadId: 'Layanan IT profesional,', boldEn: 'from trusted agencies.', boldId: 'dari agency terpercaya.' },
  { key: 'community', tone: 'green' as Tone, href: '/directory', en: 'Community', id: 'Komunitas', leadEn: 'Discussions and networking,', leadId: 'Diskusi dan networking,', boldEn: 'all in one place.', boldId: 'dalam satu tempat.' },
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
    { role: 'Mobile Engineer (Flutter)', company: 'Sahabat Finansial', location: 'Jakarta', setup: 'Hybrid', type: 'Full-time', level: 'Mid', stack: ['Flutter', 'Dart', 'Firebase'], pay: 'Rp 16–24jt', posted: '3 jam lalu' },
    { role: 'DevOps Engineer', company: 'Nusantara Cloud', location: 'Bandung', setup: 'Remote', type: 'Full-time', level: 'Senior', stack: ['Kubernetes', 'Terraform', 'AWS'], pay: 'Rp 22–32jt', posted: '7 jam lalu' },
    { role: 'QA Engineer', company: 'Solusi Data', location: 'Jakarta', setup: 'Onsite', type: 'Full-time', level: 'Mid', stack: ['Playwright', 'CI/CD'], pay: 'Rp 12–18jt', posted: '1 hari lalu' },
    { role: 'Frontend Engineer', company: 'Ruang Belajar', location: 'Yogyakarta', setup: 'Remote', type: 'Full-time', level: 'Mid', stack: ['React', 'TypeScript', 'Next.js'], pay: 'Rp 14–20jt', posted: '2 hari lalu' },
  ],
  projects: [
    { role: 'Payment Infrastructure Revamp', company: 'Koperasi Nusantara', location: 'Jakarta', setup: 'Remote', type: 'Project', level: 'Senior', stack: ['Go', 'Kafka', 'PostgreSQL'], pay: 'Rp 85–120jt', posted: '6 jam lalu' },
    { role: 'Company Profile + CMS', company: 'CV Adiwangsa', location: 'Semarang', setup: 'Remote', type: 'Project', level: 'Mid', stack: ['Next.js', 'Sanity'], pay: 'Rp 25–40jt', posted: '1 hari lalu' },
    { role: 'Dashboard Analitik Retail', company: 'Toko Sinar Jaya', location: 'Medan', setup: 'Hybrid', type: 'Project', level: 'Mid', stack: ['React', 'Metabase'], pay: 'Rp 35–55jt', posted: '2 hari lalu' },
    { role: 'Aplikasi Mobile Koperasi', company: 'Koperasi Sejahtera', location: 'Malang', setup: 'Remote', type: 'Project', level: 'Mid', stack: ['Flutter', 'Firebase'], pay: 'Rp 30–45jt', posted: '3 hari lalu' },
    { role: 'Sistem Inventori Gudang', company: 'PT Mitra Logistik', location: 'Surabaya', setup: 'Onsite', type: 'Project', level: 'Senior', stack: ['Laravel', 'MySQL'], pay: 'Rp 40–60jt', posted: '4 hari lalu' },
    { role: 'Landing Page + SEO', company: 'Kopi Kita', location: 'Bali', setup: 'Remote', type: 'Project', level: 'Junior', stack: ['Next.js', 'Tailwind'], pay: 'Rp 8–15jt', posted: '5 hari lalu' },
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

const courses = [
  { title: 'Backend Scalable dengan Go', instructor: 'Rizky Pratama', level: 'Intermediate', duration: '8j 40m', rating: 4.8, learners: '1.2K', thumb: px('270404', 240, 160) },
  { title: 'Design System dari Nol', instructor: 'Sarah Widodo', level: 'Beginner', duration: '5j 10m', rating: 4.9, learners: '2.4K', thumb: px('1966452', 240, 160) },
  { title: 'MLOps untuk Data Scientist', instructor: 'Aditya Nugroho', level: 'Advanced', duration: '11j 05m', rating: 4.7, learners: '860', thumb: px('8386440', 240, 160) },
  { title: 'React & Next.js Mendalam', instructor: 'Maya Santoso', level: 'Intermediate', duration: '9j 20m', rating: 4.8, learners: '1.8K', thumb: px('1181244', 240, 160) },
  { title: 'Fundamental Keamanan Aplikasi Web', instructor: 'Bayu Prakoso', level: 'Beginner', duration: '6j 30m', rating: 4.6, learners: '950', thumb: px('60504', 240, 160) },
];

const events = [
  { day: '18', month: 'Sep', title: 'Jakarta Cloud Native Meetup', org: 'CNCF Jakarta', place: 'Jakarta · Onsite', cat: 'Meetup', attendees: 240, thumb: px('7643736', 320, 200) },
  { day: '24', month: 'Sep', title: 'Hackathon Fintech Nusantara', org: 'Fintech ID', place: 'Bandung · Onsite', cat: 'Hackathon', attendees: 512, thumb: px('17724731', 320, 200) },
  { day: '02', month: 'Okt', title: 'Workshop: Observability 101', org: 'DevOps Indonesia', place: 'Online', cat: 'Workshop', attendees: 890, thumb: px('9301872', 320, 200) },
  { day: '11', month: 'Okt', title: 'UI/UX Conference Surabaya', org: 'Designudy', place: 'Surabaya · Onsite', cat: 'Conference', attendees: 320, thumb: px('8761524', 320, 200) },
  { day: '19', month: 'Okt', title: 'Bootcamp AI untuk Developer', org: 'AI Indonesia', place: 'Yogyakarta · Onsite', cat: 'Bootcamp', attendees: 410, thumb: px('8438922', 320, 200) },
  { day: '27', month: 'Okt', title: 'Meetup Rust & Systems Programming', org: 'Rust Jakarta', place: 'Jakarta · Onsite', cat: 'Meetup', attendees: 180, thumb: px('1181677', 320, 200) },
];

const serviceCategories = [
  'Software Development', 'UI/UX Design', 'AI Development', 'Cloud & DevOps',
  'Cybersecurity', 'Data Engineering', 'Digital Product Development', 'IT Consulting',
];

const liveActivityLabels = [
  { en: 'New jobs today', id: 'Lowongan baru hari ini' },
  { en: 'New members this week', id: 'Member baru minggu ini' },
  { en: 'New projects this week', id: 'Proyek baru minggu ini' },
  { en: 'Talent bookings this month', id: 'Booking talent bulan ini' },
];

/* What the live feed cycles through. `avatar` rows are people, the rest
   are organisations and get their activity icon instead. */
const activityFeed = [
  { avatar: null, who: 'Payungi', tone: 'blue' as Tone, en: 'posted a job', id: 'memposting lowongan', what: 'Backend Engineer (Go)', timeEn: '2m', timeId: '2 mnt' },
  { avatar: demoTalents[1].avatar_url, who: 'Sarah Widodo', tone: 'green' as Tone, en: 'joined as', id: 'bergabung sebagai', what: 'Product Designer', timeEn: '5m', timeId: '5 mnt' },
  { avatar: null, who: 'Koperasi Nusantara', tone: 'violet' as Tone, en: 'opened a project', id: 'membuka proyek', what: 'Payment Infrastructure Revamp', timeEn: '12m', timeId: '12 mnt' },
  { avatar: demoTalents[0].avatar_url, who: 'Rizky Pratama', tone: 'orange' as Tone, en: 'was booked by', id: 'dibooking oleh', what: 'PT Kirana Teknologi', timeEn: '18m', timeId: '18 mnt' },
  { avatar: demoTalents[2].avatar_url, who: 'Aditya Nugroho', tone: 'teal' as Tone, en: 'finished', id: 'menyelesaikan', what: 'MLOps untuk Data Scientist', timeEn: '26m', timeId: '26 mnt' },
  { avatar: demoTalents[3].avatar_url, who: 'Maya Santoso', tone: 'pink' as Tone, en: 'is attending', id: 'akan hadir di', what: 'Jakarta Cloud Native Meetup', timeEn: '34m', timeId: '34 mnt' },
  { avatar: null, who: 'Nusantara Cloud', tone: 'amber' as Tone, en: 'listed a service', id: 'menambahkan layanan', what: 'Cloud & DevOps', timeEn: '41m', timeId: '41 mnt' },
  { avatar: null, who: 'Sahabat Finansial', tone: 'blue' as Tone, en: 'posted a job', id: 'memposting lowongan', what: 'Mobile Engineer (Flutter)', timeEn: '1h', timeId: '1 jam' },
];

/* Turns the activity FOMO into a next step, one per audience. */
const joinActions = [
  { href: '/jobs/post', tone: 'blue' as Tone, forEn: 'For companies', forId: 'Untuk perusahaan', en: 'Post a job', id: 'Pasang lowongan', subEn: 'Reach vetted IT talent in days.', subId: 'Jangkau talent IT terverifikasi dalam hitungan hari.' },
  { href: '/services', tone: 'amber' as Tone, forEn: 'For agencies & freelancers', forId: 'Untuk agency & freelancer', en: 'Offer your services', id: 'Tawarkan layanan', subEn: 'Get discovered by companies that need you.', subId: 'Ditemukan perusahaan yang butuh keahlianmu.' },
  { href: '/register', tone: 'orange' as Tone, forEn: 'For IT professionals', forId: 'Untuk praktisi IT', en: 'Build your profile', id: 'Buat profil', subEn: 'Show real work, get booked.', subId: 'Tunjukkan karya nyata, dapatkan booking.' },
];

const testimonials = [
  { textEn: 'Every interaction feels intentional. This platform gave me clarity I’d been searching for since I started freelancing — from finding real clients to actually getting paid on time, every single step just makes sense.', textId: 'Setiap interaksi terasa intentional. Platform ini memberi kejelasan yang saya cari sejak mulai freelance — mulai dari menemukan klien sungguhan sampai dibayar tepat waktu, semuanya terasa masuk akal.', author: 'Rizky Pratama', role: 'Backend Dev · Jakarta', photo: px('5308640', 200, 200), photoTall: px('5308640', 480, 640) },
  { textEn: 'It goes beyond functionality — it offers direction. The authenticity is unmatched, and honestly it changed how I hire. I used to post jobs on five different sites; now I only need one place to find people who actually fit.', textId: 'Melampaui fungsionalitas — ia memberi arah. Keasliannya tak tertandingi, dan sejujurnya ini mengubah cara saya merekrut. Dulu saya posting lowongan di lima situs berbeda, sekarang cukup satu tempat untuk menemukan orang yang benar-benar cocok.', author: 'Sarah Wijaya', role: 'Founder · Bandung', photo: px('7752820', 200, 200), photoTall: px('7752820', 480, 640) },
  { textEn: 'Simple and deep. I could focus on meaningful outcomes, not processes. Every course, every project brief, every conversation in the community feels like it was built by someone who actually does this work every day.', textId: 'Simpel dan mendalam. Saya bisa fokus pada hasil, bukan proses. Setiap kursus, setiap brief proyek, setiap obrolan di komunitas terasa dibuat oleh orang yang benar-benar menjalani pekerjaan ini setiap hari.', author: 'Aditya Nugroho', role: 'Data Scientist · Surabaya', photo: px('6942776', 200, 200), photoTall: px('6942776', 480, 640) },
  { textEn: 'It doesn’t overwhelm, yet delivers depth where it matters. Professional and personal at the same time — I’ve tried a handful of other platforms before, and none of them got that balance right the way this one does.', textId: 'Tidak berlebihan, tapi memberi kedalaman di tempat penting. Profesional dan personal di saat yang sama — saya sudah coba beberapa platform lain sebelumnya, dan tidak ada yang menemukan keseimbangan itu seperti di sini.', author: 'Maya Sari', role: 'Product Designer · Yogya', photo: px('15014092', 200, 200), photoTall: px('15014092', 480, 640) },
  { textEn: 'I hired two engineers here in under a week. The profiles actually show the work, not just job titles, and the whole process from shortlisting to interview scheduling took a fraction of the time we normally spend.', textId: 'Saya merekrut dua engineer di sini kurang dari seminggu. Profilnya menunjukkan karya nyata, bukan sekadar jabatan, dan seluruh proses dari shortlist sampai jadwal interview jauh lebih cepat dari biasanya.', author: 'Bayu Prakoso', role: 'CTO · PT Kirana Teknologi', photo: px('749091', 200, 200), photoTall: px('749091', 480, 640) },
  { textEn: 'The courses and the community feed keep me current without ten tabs open all day. I check one dashboard in the morning and I already know what’s happening across jobs, events, and everyone I follow.', textId: 'Kursus dan feed komunitasnya bikin saya tetap update tanpa buka sepuluh tab seharian. Cukup buka satu dashboard di pagi hari, saya sudah tahu apa yang terjadi di lowongan, event, dan orang-orang yang saya ikuti.', author: 'Nadia Rahmawati', role: 'DevOps Engineer · Semarang', photo: px('7534107', 200, 200), photoTall: px('7534107', 480, 640) },
];

/* Agency service lines. Same two-tone headline as the ecosystem cards;
   `wide` drives the 4+2 / 2+4 bento rhythm on desktop, `meta` is the
   engagement hint buyers look for, `waEn/waId` pre-fills the WhatsApp chat
   so the conversation starts with the service already named. */
const agencyCards = [
  {
    key: 'saas', tone: 'blue' as Tone, wide: true,
    tagEn: 'SaaS', tagId: 'SaaS',
    leadEn: 'Product & cloud platforms,', leadId: 'Produk & platform cloud,',
    boldEn: 'from MVP to millions of requests.', boldId: 'dari MVP sampai jutaan request.',
    metaEn: 'MVP in 6–10 weeks', metaId: 'MVP dalam 6–10 minggu',
    waEn: "Hi MasmasIT, I'd like to build a SaaS product with your team.", waId: 'Halo MasmasIT, saya ingin membangun produk SaaS bersama tim Anda.',
  },
  {
    key: 'ai', tone: 'violet' as Tone, wide: false,
    tagEn: 'AI', tagId: 'AI',
    leadEn: 'Chatbots, ML & data pipelines,', leadId: 'Chatbot, ML & data pipeline,',
    boldEn: 'shipped to real users.', boldId: 'dirilis ke pengguna nyata.',
    metaEn: 'Pilot in 4 weeks', metaId: 'Pilot dalam 4 minggu',
    waEn: "Hi MasmasIT, I'd like to discuss an AI project.", waId: 'Halo MasmasIT, saya ingin diskusi proyek AI.',
  },
  {
    key: 'creative', tone: 'pink' as Tone, wide: false,
    tagEn: 'Creative', tagId: 'Kreatif',
    leadEn: 'Design, brand & UI kits,', leadId: 'Desain, brand & UI kit,',
    boldEn: 'as good as it works.', boldId: 'secantik performanya.',
    metaEn: 'Brand kit in 3 weeks', metaId: 'Brand kit dalam 3 minggu',
    waEn: "Hi MasmasIT, I'd like help with design & branding.", waId: 'Halo MasmasIT, saya butuh bantuan desain & branding.',
  },
  {
    key: 'hr', tone: 'orange' as Tone, wide: true,
    tagEn: 'HR', tagId: 'HR',
    leadEn: 'Recruitment & HRIS,', leadId: 'Rekrutmen & HRIS,',
    boldEn: 'hire faster without the spreadsheets.', boldId: 'rekrut lebih cepat tanpa spreadsheet.',
    metaEn: 'Shortlist in 7 days', metaId: 'Shortlist dalam 7 hari',
    waEn: "Hi MasmasIT, I'd like support with recruitment / HRIS.", waId: 'Halo MasmasIT, saya butuh dukungan rekrutmen / HRIS.',
  },
];

const WA_NUMBER = '6281234567890';
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

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
        <Link href={href} className="hidden shrink-0 text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground sm:block">
          {cta}
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
    <span className="wash-tag shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium leading-4">
      {children}
    </span>
  );
}

/* Ecosystem card footer — a live preview of that section's real data, sized
   to consume all leftover card height (flex-1) so nothing sits empty.
   Talents keeps its auto-scrolling marquee; the rest are user-swipeable
   (overflow-x-auto), edges softly faded, scrollbar hidden either way.
   `flip` bleeds the strip to the card's top edge instead of its bottom,
   for cards whose header renders below the preview. */
const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

function EcosystemPreview({ ekey, flip }: { ekey: string; flip: boolean }) {

  if (ekey === 'talents') {
    return (
      <div className={`flex-1 min-h-0 marquee-fade -mx-5 overflow-hidden ${flip ? '-mt-5' : '-mb-5'}`}>
        <div className={`animate-marquee flex h-full w-max gap-2.5 px-5 ${flip ? 'pb-3 pt-5' : 'pb-5 pt-4'}`}>
          {[...demoTalents, ...demoTalents].map((tal, idx) => (
            <img
              key={`${tal.id}-${idx}`}
              src={tal.avatar_url ?? ''}
              alt=""
              loading="lazy"
              className="h-full w-32 shrink-0 rounded-lg border-2 border-white/25 object-cover"
            />
          ))}
        </div>
      </div>
    );
  }

  if (ekey === 'jobs') {
    const half = Math.ceil(opportunities.jobs.length / 2);
    const rowA = opportunities.jobs.slice(0, half);
    const rowB = opportunities.jobs.slice(half);
    const card = (j: (typeof opportunities.jobs)[number], idx: number) => (
      <div key={`${j.role}-${idx}`} className="flex h-full w-48 shrink-0 flex-col justify-center rounded-lg wash-tint p-3.5">
        <p className="truncate text-sm font-medium">{j.role}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{j.company} · {j.location}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {j.stack.slice(0, 2).map((s) => <Chip key={s}>{s}</Chip>)}
        </div>
        <p className="wash-ink mt-2.5 truncate text-sm font-semibold">{j.pay}</p>
      </div>
    );
    return (
      <div className={`flex flex-1 min-h-0 flex-col gap-2.5 marquee-fade -mx-5 overflow-hidden ${flip ? '-mt-5' : '-mb-5'}`}>
        <div className={`min-h-0 flex-1 overflow-hidden ${flip ? 'pt-5' : 'pt-4'}`}>
          <div className="animate-marquee flex h-full w-max gap-2.5 px-5">
            {[...rowA, ...rowA].map((item, idx) => card(item, idx))}
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-hidden ${flip ? 'pb-3' : 'pb-5'}`}>
          <div className="animate-marquee-reverse flex h-full w-max gap-2.5 px-5">
            {[...rowB, ...rowB].map((item, idx) => card(item, idx))}
          </div>
        </div>
      </div>
    );
  }

  if (ekey === 'projects') {
    const half = Math.ceil(opportunities.projects.length / 2);
    const rowA = opportunities.projects.slice(0, half);
    const rowB = opportunities.projects.slice(half);
    const card = (p: (typeof opportunities.projects)[number], idx: number) => (
      <div key={`${p.role}-${idx}`} className="flex h-full w-40 shrink-0 flex-col justify-center rounded-lg wash-tint p-3.5">
        <p className="truncate text-sm font-medium">{p.role}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{p.company}</p>
        <p className="wash-ink mt-2.5 truncate text-xs font-semibold">{p.pay}</p>
      </div>
    );
    return (
      <div className={`flex flex-1 min-h-0 flex-col gap-2.5 marquee-fade -mx-5 overflow-hidden ${flip ? '-mt-5' : '-mb-5'}`}>
        <div className={`min-h-0 flex-1 overflow-hidden ${flip ? 'pt-5' : 'pt-4'}`}>
          <div className="animate-marquee flex h-full w-max gap-2.5 px-5">
            {[...rowA, ...rowA].map((item, idx) => card(item, idx))}
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-hidden ${flip ? 'pb-3' : 'pb-5'}`}>
          <div className="animate-marquee-reverse flex h-full w-max gap-2.5 px-5">
            {[...rowB, ...rowB].map((item, idx) => card(item, idx))}
          </div>
        </div>
      </div>
    );
  }

  if (ekey === 'learn') {
    return (
      <div className={`flex-1 min-h-0 marquee-fade -mx-5 overflow-hidden ${flip ? '-mt-5' : '-mb-5'}`}>
        <div className={`animate-marquee flex h-full w-max gap-2.5 px-5 ${flip ? 'pb-3 pt-5' : 'pb-5 pt-4'}`}>
          {[...courses, ...courses].map((c, idx) => (
            <div key={`${c.title}-${idx}`} className="relative h-full w-40 shrink-0 overflow-hidden rounded-lg border-2 border-white/25">
              <img src={c.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-xs font-medium leading-snug text-white">{c.title}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (ekey === 'events') {
    return (
      <div className={`flex-1 min-h-0 marquee-fade -mx-5 overflow-hidden ${flip ? '-mt-5' : '-mb-5'}`}>
        <div className={`animate-marquee flex h-full w-max gap-2.5 px-5 ${flip ? 'pb-3 pt-5' : 'pb-5 pt-4'}`}>
          {[...events, ...events].map((ev, idx) => (
            <div key={`${ev.title}-${idx}`} className="relative h-full w-40 shrink-0 overflow-hidden rounded-lg border-2 border-white/25">
              <img src={ev.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute left-1.5 top-1.5 rounded bg-white px-1.5 py-0.5 leading-none text-neutral-900">
                <span className="tnum block text-xs font-semibold">{ev.day}</span>
              </div>
              <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-xs font-medium leading-snug text-white">{ev.title}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (ekey === 'services') {
    return (
      <div className="mt-4 flex flex-1 min-h-0 flex-wrap content-start gap-2.5">
        {serviceCategories.map((c) => (
          <span
            key={c}
            className="wash-chip flex h-fit shrink-0 items-center rounded-full px-4 py-2.5 text-xs font-semibold"
          >
            {c}
          </span>
        ))}
      </div>
    );
  }

  if (ekey === 'community') {
    const topics = ['Discussions', 'Knowledge Sharing', 'Networking', 'Collaboration', 'Mentoring', 'Career Advice'];
    return (
      <div className="mt-4 flex flex-1 min-h-0 flex-wrap content-start gap-2.5">
        {topics.map((c) => (
          <span
            key={c}
            className="wash-chip flex h-fit shrink-0 items-center rounded-full px-4 py-2.5 text-xs font-semibold"
          >
            {c}
          </span>
        ))}
      </div>
    );
  }

  return null;
}

/* Agency card body — a small, believable artefact of each service's output
   (dashboard, chat, UI kit, hiring funnel) instead of a paragraph describing
   it. Built in markup so it stays crisp, themed and translatable. Surfaces
   reuse the ecosystem preview tokens (bg-background/40 + hairline border). */
const surface = 'rounded-lg wash-panel';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Flips to true the first time the element is ~35% on screen, then stops
   observing — entrance animations play once, never on every scroll pass.
   Clipping by the mobile carousel counts, so off-screen cards wait to be
   swiped in. */
function useInViewOnce<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* Eased count-up from 0; tabular figures keep the width from jittering. */
function CountUp({ to, run, decimals = 0, suffix = '', duration = 1400, delay = 0 }: {
  to: number; run: boolean; decimals?: number; suffix?: string; duration?: number; delay?: number;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) { setV(to); return; }
    let raf = 0;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [run, to, duration, delay]);
  return <>{v.toFixed(decimals)}{suffix}</>;
}

/* Fade-and-rise used by the smaller preview pieces. */
const rise = (on: boolean) =>
  `transition-[opacity,transform] duration-700 ease-out ${on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`;

function AgencyPreview({ akey, tone }: { akey: string; tone: (typeof tones)[Tone] }) {
  const { t } = useLang();
  const [ref, inView] = useInViewOnce<HTMLDivElement>();

  // Chat choreography: question → typing → answer → typing again.
  const [chatStep, setChatStep] = useState(0);
  useEffect(() => {
    if (akey !== 'ai' || !inView) return;
    if (prefersReducedMotion()) { setChatStep(4); return; }
    const timers = [300, 1000, 2300, 3000].map((ms, i) => setTimeout(() => setChatStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [akey, inView]);

  if (akey === 'saas') {
    const line = 'M0,52 C18,50 28,44 44,45 S70,36 88,37 S116,26 134,27 S162,14 178,13 S194,6 200,5';
    const metrics = [
      { en: 'Uptime', id: 'Uptime', to: 99.98, dec: 2, suffix: '%' },
      { en: 'p95', id: 'p95', to: 118, dec: 0, suffix: 'ms' },
      { en: 'Deploys', id: 'Deploy', to: 42, dec: 0, suffix: '/wk' },
    ];
    return (
      <div ref={ref} className="mt-5 flex flex-1 min-h-0 flex-col gap-2.5 lg:flex-row">
        <div className={`${surface} flex min-h-[150px] flex-1 flex-col p-3.5`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{t('Requests / min', 'Request / menit')}</span>
            <span className={`tnum text-xs font-medium ${tone.text} transition-opacity delay-1000 duration-500 ${inView ? 'opacity-100' : 'opacity-0'}`}>+38%</span>
          </div>
          <p className="tnum mt-1 text-lg font-semibold tracking-tight">
            <CountUp to={24.6} decimals={1} suffix="K" run={inView} duration={1600} />
          </p>
          <div className="relative mt-2 min-h-[56px] flex-1">
            {/* Left-to-right wipe via clip-path; stroke dash tricks break with
                non-scaling strokes on a stretched viewBox. */}
            <svg
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              aria-hidden
              className="absolute inset-0 h-full w-full"
              style={{
                clipPath: inView ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                transition: 'clip-path 1.6s cubic-bezier(0.65, 0, 0.35, 1)',
              }}
            >
              <defs>
                <linearGradient id="agency-saas-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`hsl(var(${tone.cssVar}))`} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={`hsl(var(${tone.cssVar}))`} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${line} L200,60 L0,60 Z`} fill="url(#agency-saas-fill)" />
              <path d={line} fill="none" stroke={`hsl(var(${tone.cssVar}))`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-foreground/[0.07] pt-3 text-xs text-muted-foreground">
            <span className="animate-pulse-soft h-1.5 w-1.5 shrink-0 rounded-full bg-eco-green" />
            <span className="truncate"><span className="text-foreground">main</span> · {t('deployed 2m ago', 'dirilis 2 menit lalu')}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 lg:w-40 lg:grid-cols-1">
          {metrics.map((m, i) => (
            <div
              key={m.en}
              className={`${surface} flex flex-col justify-center p-3 ${rise(inView)}`}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              <span className="truncate text-[11px] text-muted-foreground">{t(m.en, m.id)}</span>
              <span className="tnum mt-1 truncate text-sm font-semibold sm:text-base">
                <CountUp to={m.to} decimals={m.dec} suffix={m.suffix} run={inView} delay={300 + i * 150} />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (akey === 'ai') {
    const typing = (
      <span className="flex w-fit items-center gap-1 rounded-xl rounded-bl-sm bg-secondary px-3 py-2.5 animate-fade-up" aria-hidden>
        {[0, 1, 2].map((d) => (
          <span key={d} className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 0.3}s` }} />
        ))}
      </span>
    );
    return (
      <div ref={ref} className={`${surface} mt-5 flex flex-1 min-h-0 flex-col p-3.5`}>
        <div className="flex items-center gap-2 border-b border-foreground/[0.07] pb-3">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${tone.soft} ${tone.text}`}>
            AI
          </span>
          <span className="truncate text-xs font-medium">{t('Store assistant', 'Asisten toko')}</span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-eco-green" /> online
          </span>
        </div>
        {/* min-height reserves the final layout so the card never jumps. */}
        <div className="flex min-h-[132px] flex-1 flex-col justify-end gap-2 pt-3 text-xs leading-snug">
          {chatStep >= 1 && (
            <p className="ml-auto max-w-[85%] animate-fade-up rounded-xl rounded-br-sm bg-secondary px-3 py-2">
              {t('Where is order #4821?', 'Pesanan #4821 sudah sampai mana?')}
            </p>
          )}
          {chatStep >= 3 && (
            <p className={`max-w-[85%] animate-fade-up rounded-xl rounded-bl-sm border px-3 py-2 ${tone.chip}`}>
              {t('Out for delivery — arriving tomorrow by 2 PM.', 'Sedang dikirim — estimasi tiba besok pukul 14.00.')}
            </p>
          )}
          {(chatStep === 2 || chatStep >= 4) && typing}
        </div>
      </div>
    );
  }

  if (akey === 'creative') {
    const swatches = ['--eco-blue', '--eco-violet', '--eco-pink', '--eco-orange', '--eco-teal', '--eco-amber'];
    return (
      <div ref={ref} className="mt-5 flex flex-1 min-h-0 flex-col gap-2.5">
        <div className={`${surface} flex flex-1 items-center gap-4 p-3.5`}>
          <span
            className={`font-display text-5xl font-bold leading-none tracking-tight transition-[opacity,letter-spacing] duration-1000 ease-out ${inView ? 'opacity-100' : 'opacity-0'}`}
            style={{ letterSpacing: inView ? '-0.025em' : '0.3em' }}
          >
            Aa
          </span>
          <div className={`min-w-0 text-xs ${rise(inView)}`} style={{ transitionDelay: '300ms' }}>
            <p className="truncate font-medium">Space Grotesk</p>
            <p className="truncate text-muted-foreground">Inter · 400—800</p>
          </div>
        </div>
        <div className="flex h-10 overflow-hidden rounded-md border border-border">
          {swatches.map((s, i) => (
            <span
              key={s}
              className="flex-1 origin-bottom transition-transform duration-500 ease-out"
              style={{ background: `hsl(var(${s}))`, transform: inView ? 'scaleY(1)' : 'scaleY(0)', transitionDelay: `${400 + i * 90}ms` }}
            />
          ))}
        </div>
        <div className={`${surface} flex items-center gap-2.5 p-3`}>
          <span className={`rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground ${rise(inView)}`} style={{ transitionDelay: '800ms' }}>Button</span>
          <span
            className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${inView ? tone.fill : 'bg-secondary'}`}
            style={{ transitionDelay: '1200ms' }}
            aria-hidden
          >
            <span
              className="h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out"
              style={{ transform: inView ? 'translateX(16px)' : 'translateX(0)', transitionDelay: '1200ms' }}
            />
          </span>
          <span className={`truncate rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground ${rise(inView)}`} style={{ transitionDelay: '950ms' }}>Chip</span>
        </div>
      </div>
    );
  }

  if (akey === 'hr') {
    const stages = [
      { en: 'Applied', id: 'Melamar', n: 128 },
      { en: 'Screening', id: 'Screening', n: 46 },
      { en: 'Interview', id: 'Interview', n: 14 },
      { en: 'Offer', id: 'Offer', n: 4 },
    ];
    const hire = demoTalents[3];
    return (
      <div ref={ref} className="mt-5 flex flex-1 min-h-0 flex-col gap-2.5 lg:flex-row">
        <div className={`${surface} flex flex-1 flex-col justify-center gap-2 p-3.5`}>
          {stages.map((s, i) => (
            <div key={s.en} className="flex items-center gap-3">
              <span className="w-16 shrink-0 truncate text-xs text-muted-foreground sm:w-20">{t(s.en, s.id)}</span>
              <div className="h-7 flex-1 overflow-hidden rounded bg-secondary">
                <div
                  className={`flex h-full items-center justify-end rounded border-r-2 pr-2 transition-[width] duration-1000 ease-out ${tone.bar}`}
                  style={{
                    width: inView ? `${Math.max(18, (s.n / stages[0].n) * 100)}%` : '0%',
                    transitionDelay: `${i * 160}ms`,
                  }}
                >
                  <span className="tnum text-xs font-medium">
                    <CountUp to={s.n} run={inView} delay={i * 160} duration={1000} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          className={`${surface} flex items-center gap-3 p-3.5 lg:w-52 lg:flex-col lg:items-start lg:justify-center ${rise(inView)}`}
          style={{ transitionDelay: '700ms' }}
        >
          <img src={hire.avatar_url ?? ''} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full border border-border object-cover lg:h-12 lg:w-12" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{hire.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{hire.role}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-[opacity,transform] ${tone.chip} ${tone.text} duration-500 ease-out ${inView ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
            style={{ transitionDelay: '1300ms' }}
          >
            {t('Offer accepted', 'Offer diterima')}
          </span>
          <p className="hidden text-xs text-muted-foreground lg:block">
            {t('Time to hire', 'Waktu rekrut')}{' '}
            <span className="tnum font-medium text-foreground">
              <CountUp to={11} run={inView} delay={900} duration={900} /> {t('days', 'hari')}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/* Testimonials — a non-stop infinite marquee of tall portrait cards (photo
   full-bleed, quote overlaid on a bottom gradient). Same duplicated-array
   marquee technique used across the Ecosystem previews, never pauses. */
function TestimonialMarquee() {
  const { t } = useLang();

  return (
    <div className="marquee-fade -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
      <div className="animate-marquee flex w-max gap-5 px-4 sm:gap-6 sm:px-6 lg:px-8">
        {[...testimonials, ...testimonials].map((q, idx) => (
          <figure
            key={`${q.author}-${idx}`}
            className="relative h-[420px] w-64 shrink-0 overflow-hidden rounded-3xl border border-border sm:h-[480px] sm:w-72"
          >
            <img src={q.photoTall} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            {/* Light floating caption instead of a dark gradient over the photo. */}
            <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 p-4 backdrop-blur-md">
              <blockquote className="line-clamp-3 text-sm leading-snug text-neutral-800">
                “{t(q.textEn, q.textId)}”
              </blockquote>
              <p className="mt-2.5 text-sm font-semibold text-neutral-950">{q.author}</p>
              <p className="text-xs text-neutral-500">{q.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function HomePage() {
  const { t } = useLang();
  // null until counted — so a loading page never flashes a row of zeros.
  const [live, setLive] = useState<number[] | null>(null);
  // Zeros read as "nobody is here"; only surface the counters once real
  // activity exists, otherwise the demo feed carries the section alone.
  const showLiveStats = !!live && live.some((n) => n > 0);

  // mailto: silently does nothing without a desktop mail client — copying
  // the address is the reliable fallback.
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast.success(t('Email address copied', 'Alamat email disalin'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };

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
    })();
  }, []);

  return (
    <AppShell>
      <PageDecor>
        {/* Dark stage — hero + about render in the `.dark` token scope and sit
             as one full-bleed block, so the page opens dark and hands over to the
             light canvas at the ecosystem. */}
        <div className="dark relative overflow-hidden bg-background">
        {/* 1 ── HERO ------------------------------------------------------- */}
        <section className="accent-green relative flex min-h-screen items-center overflow-hidden">
          <img
            src={heroBackground.src}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 30%, transparent 55%, hsl(var(--background)) 92%)',
            }}
          />
          <div className="relative mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <h1 className="mx-auto text-4xl font-extrabold leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block lg:whitespace-nowrap">{t("Indonesia's IT ecosystem,", 'Ekosistem IT Indonesia,')}</span>
              <span className="block">{t('in one place.', 'dalam satu tempat.')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              {t(
                'Discover resources, opportunities, talent, learning, projects, and communities built for Indonesian IT professionals.',
                'Temukan resource, peluang, talent, materi belajar, proyek, dan komunitas untuk praktisi IT Indonesia.'
              )}
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="btn-gradient h-14 w-full gap-1.5 rounded-full px-7 text-base font-semibold text-white sm:h-11 sm:w-auto sm:text-sm">
                  {t('Start free', 'Mulai gratis')}
                </Button>
              </Link>
              <Link href="/talents" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 w-full gap-1.5 rounded-full bg-foreground px-7 text-base text-background hover:bg-foreground/90 sm:h-11 sm:w-auto sm:text-sm">
                  {t('Find Talent', 'Cari Talent')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 1b ── ABOUT / WHAT IS MASMASIT ------------------------------------ */}
        <section className="relative overflow-hidden bg-background">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t('About', 'Tentang')}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('What is MasmasIT?', 'Apa itu MasmasIT?')}
              </h2>
            </div>
            <div>
              <p className="font-display text-xl font-semibold leading-snug tracking-tight text-balance sm:text-2xl">
                {t(
                  'MasmasIT is the home for Indonesian IT professionals to build their career and business.',
                  'MasmasIT adalah rumah bagi praktisi IT Indonesia untuk membangun karier dan bisnis mereka.'
                )}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
                {t(
                  'From job listings and freelance projects, to courses, events, talent bookings, and professional services — MasmasIT brings everything Indonesian IT practitioners need into one connected platform.',
                  'Dari lowongan kerja dan proyek freelance, hingga kursus, event, booking talent, dan layanan profesional — MasmasIT menyatukan semua kebutuhan praktisi IT Indonesia dalam satu platform yang terhubung.'
                )}
              </p>
            </div>
          </div>
        </section>

        </div>

        {/* 2 ── EXPLORE THE ECOSYSTEM -------------------------------------- */}
        <section className="relative overflow-hidden bg-background">
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Ecosystem', 'Ekosistem')}
              title={t('Everything an Indonesian IT professional needs', 'Semua yang dibutuhkan praktisi IT Indonesia')}
              desc={t('Seven connected areas, one account. Start anywhere.', 'Tujuh area yang saling terhubung, satu akun. Mulai dari mana saja.')}
            />

            <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-1 sm:grid sm:snap-none sm:overflow-visible sm:pb-0 sm:grid-cols-2 lg:grid-cols-6">
              {ecosystem.map((e, i) => {
                const lead = i < 1;
                const flip = !lead && i % 2 === 0;
                const span = `w-[85vw] max-w-[360px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink sm:snap-align-none ${lead ? 'sm:col-span-2 lg:col-span-6' : 'lg:col-span-2'}`;
                const tone = tones[e.tone];
                const header = (
                  <div className={flip ? 'mt-4' : ''}>
                    <p className={`font-display leading-snug tracking-tight ${lead ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
                      <span className="font-normal text-muted-foreground">{t(e.leadEn, e.leadId)} </span>
                      <span className="font-bold text-foreground">{t(e.boldEn, e.boldId)}</span>
                    </p>
                  </div>
                );
                const preview = <EcosystemPreview ekey={e.key} flip={flip} />;
                const inner = (
                  <div className={`group flex h-full flex-col overflow-hidden rounded-xl transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-card-hover ${tone.wash} ${lead ? 'min-h-[320px] p-6' : 'min-h-[380px] p-5'}`}>
                    {flip ? <>{preview}{header}</> : <>{header}{preview}</>}
                  </div>
                );
                return e.href
                  ? <Link key={e.key} href={e.href} className={span}>{inner}</Link>
                  : <div key={e.key} className={span}>{inner}</div>;
              })}
            </div>
          </div>
        </section>

        {/* 2b ── AGENCY — sibling of the ecosystem grid: same card chrome,
             two-tone headline and live preview, in a 4+2 / 2+4 bento. ------ */}
        <section className="relative overflow-hidden bg-background">
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency</p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t('Build with our team', 'Bangun bersama tim kami')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'One vetted team for product, AI, design and hiring — instead of stitching a dozen freelancers together.',
                    'Satu tim terverifikasi untuk produk, AI, desain, dan rekrutmen — tanpa perlu merangkai belasan freelancer sendiri.'
                  )}
                </p>
              </div>
              <a href={waLink(t("Hi MasmasIT, I'd like to talk about a project.", 'Halo MasmasIT, saya ingin diskusi proyek.'))} target="_blank" rel="noreferrer" className="hidden shrink-0 sm:block">
                <Button size="lg" className="gap-1.5 rounded-full px-6">
                  {t('Talk to us', 'Hubungi kami')}
                </Button>
              </a>
            </div>

            <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-1 sm:grid sm:snap-none sm:overflow-visible sm:pb-0 sm:grid-cols-2 lg:grid-cols-6">
              {agencyCards.map((c) => (
                <a
                  key={c.key}
                  href={waLink(t(c.waEn, c.waId))}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-[85vw] max-w-[360px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink ${c.wide ? 'lg:col-span-4' : 'lg:col-span-2'}`}
                >
                  <div className={`group flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl p-5 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-card-hover ${tones[c.tone].wash}`}>
                    <p className="wash-label">{t(c.tagEn, c.tagId)}</p>
                    <p className="mt-3 font-display text-xl leading-snug tracking-tight text-balance sm:text-2xl">
                      <span className="font-normal text-muted-foreground">{t(c.leadEn, c.leadId)} </span>
                      <span className="font-bold text-foreground">{t(c.boldEn, c.boldId)}</span>
                    </p>

                    <AgencyPreview akey={c.key} tone={tones[c.tone]} />

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/20 pt-4 text-xs">
                      <span className="text-muted-foreground">{t(c.metaEn, c.metaId)}</span>
                      <span className="font-medium text-foreground underline decoration-white/40 underline-offset-4 transition-colors group-hover:decoration-white">
                        {t('Talk to us', 'Hubungi kami')}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <a href={waLink(t("Hi MasmasIT, I'd like to talk about a project.", 'Halo MasmasIT, saya ingin diskusi proyek.'))} target="_blank" rel="noreferrer" className="mt-6 block sm:hidden">
              <Button size="lg" className="h-14 w-full gap-1.5 rounded-full text-base">
                {t('Talk to us', 'Hubungi kami')}
              </Button>
            </a>
          </div>
        </section>

        {/* 11b ── TESTIMONIALS ------------------------------------------------ */}
        <section className="relative overflow-hidden bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t('Stories', 'Cerita')}</p>
            <h2 className="mx-auto mt-3 text-4xl font-extrabold tracking-tighter sm:text-6xl">
              {t('Loved by the community', 'Dicintai komunitas')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">
              {t(
                'Hundreds of Indonesian IT professionals already build their career and business with MasmasIT.',
                'Ratusan praktisi IT Indonesia sudah membangun karier dan bisnis mereka bersama MasmasIT.'
              )}
            </p>
            <Link href="/register" className="mt-8 inline-block">
              <Button size="lg" className="gap-1.5 rounded-full px-8">
                {t('Join now', 'Gabung sekarang')}
              </Button>
            </Link>
          </div>

          <div className="mt-14 sm:mt-16">
            <TestimonialMarquee />
          </div>
        </section>

        {/* 11c ── LIVE ACTIVITY — a moving feed proves the platform is alive;
             real counters join in once they're worth showing. ------------- */}
        <section className="relative bg-background">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <SectionHead
              eyebrow={t('Live activity', 'Aktivitas terkini')}
              title={t('Happening on MasmasIT right now', 'Yang sedang terjadi di MasmasIT')}
              desc={t('Jobs, projects, bookings and new members — as they happen.', 'Lowongan, proyek, booking, dan member baru — saat itu juga.')}
              href="/activity"
              cta={t('See all activity', 'Lihat semua aktivitas')}
            />

            <div className="grid gap-4 lg:grid-cols-6">
              <div className="wash wash-teal flex flex-col overflow-hidden rounded-xl lg:col-span-4">
                <div className="flex items-center justify-between gap-3 border-b border-white/15 px-5 py-3.5">
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-white/60" />
                      <span className="relative h-2 w-2 rounded-full bg-white" />
                    </span>
                    Live
                  </span>
                  <span className="text-xs text-muted-foreground">{t('Updated in real time', 'Diperbarui real time')}</span>
                </div>

                {showLiveStats && live && (
                  <div className="grid grid-cols-2 gap-px border-b border-white/15 bg-white/15 sm:grid-cols-4">
                    {liveActivityLabels.map((a, i) => (
                      <div key={a.en} className="bg-black/10 px-5 py-4">
                        <p className="tnum font-display text-2xl font-semibold tracking-tight">{live[i].toLocaleString('id-ID')}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{t(a.en, a.id)}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="group marquee-fade-y relative h-[340px] overflow-hidden sm:h-[380px]">
                  <ul className="animate-marquee-y group-hover:[animation-play-state:paused]">
                    {[...activityFeed, ...activityFeed].map((a, idx) => (
                      <li key={`${a.who}-${idx}`} aria-hidden={idx >= activityFeed.length} className="flex items-center gap-3.5 border-b border-white/15 px-5 py-3.5">
                        {a.avatar ? (
                          <img src={a.avatar} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-full border-2 border-white/30 object-cover" />
                        ) : (
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold ${tones[a.tone].text}`}>
                            {initials(a.who)}
                          </span>
                        )}
                        <p className="min-w-0 flex-1 text-sm leading-snug text-muted-foreground">
                          <span className="font-medium text-foreground">{a.who}</span> {t(a.en, a.id)}{' '}
                          <span className="font-medium text-foreground">{a.what}</span>
                        </p>
                        <span className="tnum shrink-0 text-xs text-muted-foreground">{t(a.timeEn, a.timeId)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="wash wash-orange flex flex-col rounded-xl p-5 lg:col-span-2">
                <p className="font-display text-xl leading-snug tracking-tight text-balance sm:text-2xl">
                  <span className="font-normal text-muted-foreground">{t('Your move next,', 'Giliranmu berikutnya,')} </span>
                  <span className="font-bold text-foreground">{t('start in a minute.', 'mulai dalam semenit.')}</span>
                </p>
                <div className="mt-5 flex flex-1 flex-col gap-2.5">
                  {joinActions.map((a) => (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="wash-deep group flex flex-1 items-center gap-3.5 rounded-lg p-3.5 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold uppercase tracking-widest text-white/75">{t(a.forEn, a.forId)}</span>
                        <span className="mt-1 block text-sm font-medium">{t(a.en, a.id)}</span>
                        <span className="block text-xs leading-snug text-muted-foreground">{t(a.subEn, a.subId)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12 ── FINAL CTA — full-bleed band that bookends the hero artwork.
             Pitch + one primary action on the left, talk-first channels on
             the right; stacks to a single column on mobile. */}
        <section className="dark accent-green relative overflow-hidden bg-background">
          <img
            src={heroBackground.src}
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(to right, hsl(var(--background) / 0.35), hsl(var(--background) / 0.85) 60%, hsl(var(--background) / 0.95))' }}
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-[1.1fr_0.9fr] md:gap-10 lg:gap-16 lg:px-8">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tighter text-balance sm:text-5xl">
                {t('Ready to join?', 'Siap bergabung?')}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground text-pretty md:mx-0">
                {t(
                  "Whether you're hiring, offering services, or growing your career — we're here.",
                  'Baik merekrut, menawarkan layanan, atau mengembangkan karier — kami di sini.'
                )}
              </p>
              <Link href="/register" className="mx-auto mt-7 block w-full sm:w-fit md:mx-0">
                <Button size="lg" className="btn-gradient h-14 w-full gap-1.5 rounded-full px-8 text-base font-semibold text-white sm:h-12 sm:w-auto">
                  {t('Join now — it’s free', 'Gabung sekarang — gratis')}
                </Button>
              </Link>
            </div>

            <div>
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground md:text-left">
                {t('Prefer to talk first?', 'Mau ngobrol dulu?')}
              </p>
              <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border">
                <a href={waLink(t("Hi MasmasIT, I'd like to know more.", 'Halo MasmasIT, saya ingin tahu lebih lanjut.'))} target="_blank" rel="noreferrer" className="group flex items-center gap-3 bg-card p-4 transition-colors hover:bg-secondary">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">WhatsApp</span>
                    <span className="block truncate text-xs text-muted-foreground">{t('Usually replies within an hour', 'Biasanya dibalas dalam 1 jam')}</span>
                  </span>
                </a>
                <a href="https://calendly.com" target="_blank" rel="noreferrer" className="group flex items-center gap-3 bg-card p-4 transition-colors hover:bg-secondary">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{t('Schedule a call', 'Jadwalkan panggilan')}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t('30 min · Calendly', '30 menit · Calendly')}</span>
                  </span>
                </a>
                <div className="group relative flex items-center gap-3 bg-card p-4 transition-colors hover:bg-secondary">
                  <a href={`mailto:${CONTACT_EMAIL}`} className="absolute inset-0" aria-label={t('Email us', 'Kirim email')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{t('Email us', 'Kirim email')}</span>
                    <span className="block truncate text-xs text-muted-foreground">{CONTACT_EMAIL}</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyEmail}
                    aria-label={t('Copy email address', 'Salin alamat email')}
                    className="relative z-10 h-8 shrink-0 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
                  >
                    {copied ? t('Copied', 'Disalin') : t('Copy', 'Salin')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageDecor>
    </AppShell>
  );
}
