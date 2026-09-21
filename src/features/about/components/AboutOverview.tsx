'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { PageDecor } from '@/components/page-decor';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';

/**
 * About is a top-level nav item, not a section inside Discover: a first-time
 * visitor should be able to answer "what is this platform" before being sent
 * into the feature list. The homepage carries a two-sentence teaser that
 * links here; this is the long version.
 */

type Bilingual = { en: string; id: string };

/* The founder block is the one part of this page that is about a person
   rather than the product, so everything editable about it lives here.
   `photo` is a plain public/ path, not an imported asset: replacing the
   file at that path swaps the portrait without touching the build, and if
   it ever goes missing the block falls back to the monogram below instead
   of shipping a broken image.

   The source is square. In the 4/5 frame below, object-cover matches the
   height and trims about 10% from each side, so the face is never cropped
   vertically. */
const FOUNDER = {
  name: 'Muh Tri Nur Pamungkas',
  role: { en: 'Founder', id: 'Founder' },
  photo: '/muhtrinur.png',
  location: 'Indonesia',
};

/* Why "Mas Mas IT". The name is where the story starts, so it is told
   before the founder's own reasoning rather than after it. */
const founderStory: Bilingual[] = [
  {
    en: 'The name "Mas Mas IT" started as a warm, peer-to-peer way of addressing one another. Today it is more than a local nickname. It describes technology talent from Indonesia now spread across the world — keeping global infrastructure running, leading product roadmaps and executing complex systems behind the scenes.',
    id: 'Nama "Mas Mas IT" berawal dari sapaan akrab yang setara. Namun hari ini, panggilan tersebut bukan sekadar sebutan lokal. Mereka adalah talenta teknologi dari Indonesia yang kini tersebar dan berkontribusi di seluruh dunia, menjaga infrastruktur global tetap berjalan, memimpin peta jalan produk, hingga mengeksekusi sistem kompleks di balik layar.',
  },
  {
    en: 'After close to a decade in project and product management, working at the intersection of digitalisation and technology transformation, I saw an urgent need through the eyes of a Product Lead. Years of serving clients from agencies and startups to large enterprises led me to one conclusion: we need an ecosystem built for collaboration if we are to go further.',
    id: 'Setelah menuju satu dekade berkarir di ranah manajemen proyek dan produk yang beririsan erat dengan digitalisasi dan transformasi teknologi, saya melihat sebuah urgensi melalui kacamata seorang Product Lead. Pengalaman panjang menangani klien dari skala agensi, startup, hingga korporasi besar memberikan saya satu kesimpulan penting: kita membutuhkan sebuah ekosistem wadah kolaborasi untuk bisa melangkah lebih jauh.',
  },
  {
    en: 'In an era where technology and artificial intelligence move this fast, tech talent must be connected to one another with a clear structure. MasmasIT exists so Indonesian IT talent can collaborate with each other, and reach fellow practitioners in other countries to execute promising projects at a global scale together.',
    id: 'Di era di mana teknologi dan kecerdasan buatan berkembang sangat cepat, talenta teknologi mutlak perlu terhubung satu sama lain dengan struktur yang jelas. MasmasIT dibangun agar talenta IT Indonesia dapat saling berkolaborasi, sekaligus menjangkau rekan sejawat praktisi IT di negara lain untuk bersama-sama mengeksekusi berbagai proyek potensial berskala global.',
  },
  {
    en: 'The biggest challenge in a tech career has never been the work itself, but a fragmented ecosystem. Job platforms are disconnected from portfolios. Portfolio sites do not connect you directly with clients. The community groups where we learn and discuss have no infrastructure to turn ideas into professional collaboration. Everyone builds the foundation of their career from scratch, alone.',
    id: 'Selama ini, tantangan terbesar dalam karir teknologi bukanlah pekerjaannya, melainkan ekosistem yang terfragmentasi. Platform pencari kerja tidak terhubung dengan portofolio karya. Situs portofolio tidak menghubungkan Anda langsung dengan klien. Grup komunitas tempat kita belajar dan berdiskusi tidak memiliki infrastruktur untuk mengubah ide menjadi kolaborasi profesional. Setiap orang membangun fondasi karirnya dari nol secara sendirian.',
  },
  {
    en: 'MasmasIT is built from Indonesia to break through those limits. We created one platform where your network, the teams you form, the products you ship and commercial opportunities all live in the same space. This is not a job board with a forum bolted on. It is a community that works as an economic ecosystem.',
    id: 'MasmasIT dibangun dari Indonesia untuk mendobrak batasan tersebut. Kami menciptakan satu platform di mana jaringan, tim yang Anda bentuk, produk yang Anda rilis, hingga peluang komersial berada di dalam ruang yang sama. Ini bukan sekadar papan lowongan kerja yang ditempelkan fitur forum. Ini adalah komunitas yang berfungsi sebagai ekosistem ekonomi.',
  },
  {
    en: 'This is the first step of a long-term vision. There is still much for us to build and achieve together on this platform.',
    id: 'Langkah ini adalah awal dari visi jangka panjang. Masih banyak hal yang harus kita bangun dan capai bersama di platform ini.',
  },
];

/* Ordered by the three groups the copy describes — Careers & Opportunities,
   Collaboration & Growth, Talent & Expertise — so the flat list still reads
   in that sequence. */
const areas: { href: string; name: Bilingual; desc: Bilingual }[] = [
  { href: '/jobs', name: { en: 'Jobs', id: 'Jobs' }, desc: { en: 'Curated full-time and freelance openings.', id: 'Lowongan pekerjaan penuh waktu dan freelance yang terkurasi.' } },
  { href: '/projects', name: { en: 'Projects', id: 'Projects' }, desc: { en: 'Client project briefs open for proposals.', id: 'Kumpulan ringkasan proyek dari klien yang terbuka untuk penawaran.' } },
  { href: '/services', name: { en: 'Services', id: 'Services' }, desc: { en: 'Professional IT services, booked as you need them.', id: 'Layanan IT profesional yang dapat dipesan sesuai kebutuhan.' } },
  { href: '/team-collabs', name: { en: 'Team Collabs', id: 'Team Collabs' }, desc: { en: 'Where practitioners form R&D teams or launch ventures together.', id: 'Ruang bagi praktisi untuk membentuk tim R&D atau meluncurkan proyek usaha bersama.' } },
  { href: '/discussions', name: { en: 'Discussions', id: 'Discussions' }, desc: { en: 'A focused forum for industry insight, technical discussion and networking.', id: 'Forum terarah untuk wawasan industri, diskusi teknis, dan jejaring.' } },
  { href: '/events', name: { en: 'Events', id: 'Events' }, desc: { en: 'Exclusive meetups, hackathons and community gatherings.', id: 'Meetup eksklusif, hackathon, dan sesi kumpul komunitas.' } },
  { href: '/builds', name: { en: 'Builds', id: 'Builds' }, desc: { en: 'A showcase of the products, SaaS and projects members are building.', id: 'Etalase pameran untuk produk, SaaS, atau proyek yang sedang dibangun oleh member.' } },
  { href: '/talents', name: { en: 'Talent', id: 'Talent' }, desc: { en: 'A directory of practitioners you can book directly for private sessions.', id: 'Direktori praktisi yang dapat dipesan langsung untuk sesi privat.' } },
  { href: '/courses', name: { en: 'Courses', id: 'Courses' }, desc: { en: 'Practical learning taught by active practitioners.', id: 'Pembelajaran praktis yang diajarkan langsung oleh praktisi aktif.' } },
  { href: '/agency', name: { en: 'Agency', id: 'Agency' }, desc: { en: 'Service catalogues from verified technology agencies.', id: 'Katalog layanan dari agensi teknologi terverifikasi.' } },
  { href: '/directory', name: { en: 'Members', id: 'Members' }, desc: { en: 'Professional profiles of all the talent powering the platform.', id: 'Profil profesional dari seluruh talenta yang menggerakkan platform ini.' } },
];

/* The four collaboration routes. They differ in where the supply comes from
   and where a client discovers it, but all end at the same hiring step. */
const hiringRoutes: { route: Bilingual; source: Bilingual; discovery: Bilingual }[] = [
  {
    route: { en: 'Solo Builder', id: 'Solo Builder' },
    source: { en: 'Hire members based on the products they showcase.', id: 'Merekrut member berdasarkan produk yang mereka pamerkan.' },
    discovery: { en: 'Spotlight', id: 'Spotlight' },
  },
  {
    route: { en: 'Freelancer', id: 'Freelancer' },
    source: { en: 'Book an individual practitioner directly.', id: 'Memesan jasa individu praktisi secara langsung.' },
    discovery: { en: 'Talents', id: 'Talents' },
  },
  {
    route: { en: 'Community Team', id: 'Community Team' },
    source: { en: 'Form a cross-functional team tailored to the project.', id: 'Membentuk tim lintas fungsi yang disesuaikan dengan kebutuhan proyek.' },
    discovery: { en: 'Team Collabs', id: 'Team Collabs' },
  },
  {
    route: { en: 'Agency', id: 'Agency' },
    source: { en: 'Contract a verified agency for end-to-end product development.', id: 'Mengontrak agensi terverifikasi untuk pengembangan produk menyeluruh.' },
    discovery: { en: 'Agency page and Spotlight', id: 'Agency Page & Spotlight' },
  },
];

export default function AboutOverview() {
  const { t } = useLang();
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <AppShell>
      <PageDecor>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <header>
            <p className="eyebrow text-muted-foreground">{t('About', 'Tentang')}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {t(
                'An Integrated Ecosystem for Tech Talent: Built in Indonesia, Connected to the World',
                'Ekosistem Terpadu untuk Tech Talent: Dibangun dari Indonesia, Terhubung ke Seluruh Dunia'
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
              {t(
                'MasmasIT is more than a community — it is the engine of an ecosystem for technology practitioners. We bring community, portfolio and workspace together in one platform. This is where industry conversations happen, side projects get showcased, and networks naturally grow into professional opportunities: full-time roles, project collaborations and B2B services.',
                'MasmasIT lebih dari sekadar komunitas, ini adalah mesin penggerak ekosistem bagi praktisi teknologi. Kami meleburkan komunitas, portofolio, dan ruang kerja ke dalam satu platform. Di sinilah diskusi industri terjadi, proyek sampingan dipamerkan, dan jejaring secara natural berkembang menjadi peluang profesional yang mencakup pekerjaan penuh waktu, kolaborasi proyek, hingga layanan B2B.'
              )}
            </p>
          </header>

          <section className="mt-14 border-t border-border pt-10">
            <h2 className="eyebrow text-muted-foreground">{t('Why MasmasIT Exists', 'Mengapa MasmasIT Hadir')}</h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-[220px_1fr] sm:gap-10">
              <div>
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-muted">
                  {photoFailed ? (
                    <span className="flex h-full w-full items-center justify-center font-brand text-5xl font-extrabold tracking-[-0.04em] text-muted-foreground/40">
                      {FOUNDER.name.charAt(0)}
                    </span>
                  ) : (
                    <img
                      src={FOUNDER.photo}
                      alt={FOUNDER.name}
                      onError={() => setPhotoFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <p className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight">{FOUNDER.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t(FOUNDER.role.en, FOUNDER.role.id)} · {FOUNDER.location}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {founderStory.map((para) => (
                  <p key={para.en} className="text-base leading-relaxed text-muted-foreground text-pretty">
                    {t(para.en, para.id)}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="eyebrow text-muted-foreground">{t('Who Is This Platform For?', 'Untuk Siapa Platform Ini?')}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-3">
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Global IT Practitioners', 'Praktisi IT Global')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Engineers, UI/UX designers, data scientists, product managers and cybersecurity specialists looking for a new role, freelance projects, or co-founders to build products with.',
                    'Engineer, UI/UX designer, data scientist, product manager, hingga spesialis keamanan siber yang mencari peran baru, proyek lepas, atau rekan pendiri untuk membangun produk bersama.'
                  )}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Companies & Clients', 'Perusahaan & Klien')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Founders and managers bringing a project brief who need verified talent or a cross-functional team ready to execute end to end.',
                    'Founder dan manajer yang membawa ringkasan proyek dan membutuhkan talenta terverifikasi atau tim lintas fungsi yang siap mengeksekusi secara penuh.'
                  )}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Agencies & Mentors', 'Agensi & Mentor')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Independent technology agencies offering a service catalogue, and senior practitioners opening private consulting and mentoring sessions alongside their main work.',
                    'Agensi teknologi independen yang menawarkan katalog layanan, serta praktisi senior yang membuka sesi konsultasi dan bimbingan privat di luar pekerjaan utama mereka.'
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="eyebrow text-muted-foreground">{t('One Account, a Borderless Ecosystem', 'Satu Akun, Ekosistem Tanpa Batas')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {t(
                'Eleven fully integrated areas. Because the community sits right inside the work ecosystem, an expert conversation is never cut off from the professional opportunity that follows it.',
                'Sebelas area yang terintegrasi penuh. Karena komunitas berada tepat di dalam ekosistem kerja, sebuah percakapan ahli tidak akan pernah terputus dari peluang profesional yang mengikutinya.'
              )}
            </p>
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {areas.map((area) => (
                <li key={area.href}>
                  <Link
                    href={area.href}
                    className="grid gap-1 py-3.5 transition-colors hover:bg-muted/40 sm:grid-cols-[200px_1fr] sm:gap-6"
                  >
                    <span className="text-sm font-semibold text-foreground">{t(area.name.en, area.name.id)}</span>
                    <span className="text-sm text-muted-foreground">{t(area.desc.en, area.desc.id)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 className="eyebrow text-muted-foreground">{t('Four Collaboration Routes', 'Empat Jalur Kolaborasi')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {t(
                'Clients and companies can find services and talent through four connected routes. Every route leads to one seamless hiring process.',
                'Klien dan perusahaan dapat menemukan layanan serta talenta melalui empat jalur yang saling terhubung. Seluruh jalur ini bermuara pada satu proses perekrutan yang mulus.'
              )}
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-border text-left">
                    <th className="py-3 pr-6 font-semibold">{t('Route', 'Jalur')}</th>
                    <th className="py-3 pr-6 font-semibold">{t('How it works', 'Cara kerja')}</th>
                    <th className="py-3 font-semibold">{t('Discovered in', 'Ditemukan di')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hiringRoutes.map((row) => (
                    <tr key={row.route.en}>
                      <td className="py-3 pr-6 font-semibold text-foreground">{t(row.route.en, row.route.id)}</td>
                      <td className="py-3 pr-6 text-muted-foreground">{t(row.source.en, row.source.id)}</td>
                      <td className="py-3 text-muted-foreground">{t(row.discovery.en, row.discovery.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="eyebrow text-muted-foreground">{t('How Access Works', 'Bagaimana Akses Bekerja')}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Open Exploration', 'Eksplorasi yang Terbuka')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Anyone can read this page, browse the public insight catalogue and discover talent without signing in. Transparency is our foundation.',
                    'Siapa pun dapat membaca halaman ini, melihat katalog wawasan publik, dan menemukan talenta tanpa perlu masuk ke sistem. Transparansi adalah fondasi kami.'
                  )}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Actions Require Verification', 'Aksi Membutuhkan Verifikasi')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Applying for jobs, submitting project proposals, joining a team and booking services all sit behind a login. Every account goes through onboarding to validate its role and keep the quality of interactions in the ecosystem high.',
                    'Melamar pekerjaan, mengajukan penawaran proyek, bergabung dengan tim, atau memesan layanan sepenuhnya berada di balik sistem login. Setiap akun melewati proses orientasi untuk memastikan validitas peran dan menjaga kualitas interaksi dalam ekosistem.'
                  )}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-14 flex flex-col items-stretch gap-3 border-t border-border pt-8 sm:flex-row sm:items-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-11 w-full rounded-full px-6 text-base font-semibold shadow-sm sm:w-auto">
                {t('Get Started', 'Daftar')}
              </Button>
            </Link>
            <Link href="/discover" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-11 w-full rounded-full px-6 text-base font-semibold sm:w-auto">
                {t('Read Discover', 'Baca Discover')}
              </Button>
            </Link>
          </div>
        </div>
      </PageDecor>
    </AppShell>
  );
}
