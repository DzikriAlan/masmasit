'use client';

import Link from 'next/link';

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

const areas: { href: string; name: Bilingual; desc: Bilingual }[] = [
  { href: '/jobs', name: { en: 'Jobs', id: 'Lowongan' }, desc: { en: 'Full-time and freelance roles.', id: 'Peran full-time dan freelance.' } },
  { href: '/projects', name: { en: 'Projects', id: 'Proyek' }, desc: { en: 'Client briefs open for bids.', id: 'Brief klien yang dibuka untuk bid.' } },
  { href: '/team-collabs', name: { en: 'Team Collabs', id: 'Team Collabs' }, desc: { en: 'Teams building R&D together.', id: 'Tim yang bangun R&D bareng.' } },
  { href: '/talents', name: { en: 'Talent', id: 'Talent' }, desc: { en: 'Practitioners you can book 1-on-1.', id: 'Praktisi yang bisa dibooking 1-on-1.' } },
  { href: '/courses', name: { en: 'Courses', id: 'Kursus' }, desc: { en: 'Taught by people doing the work.', id: 'Diajar orang yang menjalani pekerjaannya.' } },
  { href: '/agency', name: { en: 'Agency', id: 'Agency' }, desc: { en: 'Approved agencies and their catalogues.', id: 'Agency terverifikasi dan katalognya.' } },
  { href: '/services', name: { en: 'Services', id: 'Layanan' }, desc: { en: 'Professional IT services.', id: 'Layanan IT profesional.' } },
  { href: '/discussions', name: { en: 'Discussions', id: 'Diskusi' }, desc: { en: 'A light forum: topics and comments.', id: 'Forum ringan: topik dan komentar.' } },
  { href: '/directory', name: { en: 'Members', id: 'Member' }, desc: { en: 'Everyone on the platform.', id: 'Semua orang di platform ini.' } },
  { href: '/builds', name: { en: 'Builds', id: 'Builds' }, desc: { en: 'What members are building now.', id: 'Yang sedang dibangun member.' } },
  { href: '/events', name: { en: 'Events', id: 'Event' }, desc: { en: 'Meetups and hackathons.', id: 'Meetup dan hackathon.' } },
];

/* The four routes to hire. They differ in where the supply comes from and
   where a buyer discovers it, but all end at the same hiring step. */
const hiringRoutes: { route: Bilingual; source: Bilingual; discovery: Bilingual }[] = [
  {
    route: { en: 'Solo Builder', id: 'Solo Builder' },
    source: { en: 'A member showcasing their own product.', id: 'Member yang memajang produknya sendiri.' },
    discovery: { en: 'Spotlight', id: 'Spotlight' },
  },
  {
    route: { en: 'Agency', id: 'Agency' },
    source: { en: 'A team or company catalogue, in-house and member agencies alike.', id: 'Katalog tim atau perusahaan, agency in-house maupun member.' },
    discovery: { en: 'Agency page and Spotlight', id: 'Halaman Agency dan Spotlight' },
  },
  {
    route: { en: 'Freelancer', id: 'Freelancer' },
    source: { en: 'An individual practitioner.', id: 'Praktisi perorangan.' },
    discovery: { en: 'Talents', id: 'Talents' },
  },
  {
    route: { en: 'Community', id: 'Community' },
    source: { en: 'A team assembled in Team Builder.', id: 'Tim yang disusun lewat Team Builder.' },
    discovery: { en: 'Team Collabs', id: 'Team Collabs' },
  },
];

export default function AboutOverview() {
  const { t } = useLang();

  return (
    <AppShell>
      <PageDecor>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <header>
            <p className="eyebrow text-muted-foreground">{t('About', 'Tentang')}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {t(
                'One place for Indonesian IT practitioners to work, learn and build together.',
                'Satu tempat bagi praktisi IT Indonesia untuk bekerja, belajar dan membangun bersama.'
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
              {t(
                'MasmasIT is a community and an ecosystem in the same account. The community is where people talk, post what they are building and turn up to events; the ecosystem is where that turns into paid work — jobs, client projects, bookings, courses and services.',
                'MasmasIT adalah komunitas sekaligus ekosistem dalam satu akun. Komunitasnya tempat orang berbincang, memposting apa yang sedang dibangun, dan datang ke event; ekosistemnya tempat semua itu menjadi pekerjaan berbayar — lowongan, proyek klien, booking, kursus dan layanan.'
              )}
            </p>
          </header>

          <section className="mt-14">
            <h2 className="eyebrow text-muted-foreground">{t('Who it is for', 'Untuk siapa')}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-3">
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('IT practitioners', 'Praktisi IT')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Engineers, designers, data and security people in Indonesia looking for the next role, the next project, or people to build with.',
                    'Engineer, desainer, orang data dan security di Indonesia yang mencari peran berikutnya, proyek berikutnya, atau orang untuk membangun bersama.'
                  )}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Companies & clients', 'Perusahaan & klien')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Teams hiring, or bringing a brief that needs a team assembled around it rather than a single hire.',
                    'Tim yang merekrut, atau membawa brief yang butuh tim dibentuk di sekitarnya, bukan sekadar satu orang.'
                  )}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Agencies & coaches', 'Agency & coach')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Agencies listing a service catalogue, and practitioners teaching or mentoring alongside their day job.',
                    'Agency yang memajang katalog jasa, dan praktisi yang mengajar atau membimbing di samping pekerjaan utamanya.'
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="eyebrow text-muted-foreground">{t('What is inside', 'Apa isinya')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {t(
                'Eleven connected areas, one account. Community sits inside the ecosystem rather than beside it, so a conversation and the work it leads to are never two separate products.',
                'Sebelas area yang saling terhubung, satu akun. Community berada di dalam ekosistem, bukan di sampingnya, sehingga percakapan dan pekerjaan yang lahir darinya tidak pernah jadi dua produk terpisah.'
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
            <h2 className="eyebrow text-muted-foreground">{t('Four ways to hire', 'Empat jalur jasa')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {t(
                'Services reach a buyer through four different routes. They are discovered in different places, but they all end at the same hiring step.',
                'Jasa sampai ke pembeli lewat empat jalur berbeda. Ditemukan di tempat yang berbeda, tapi semuanya bermuara ke langkah hire yang sama.'
              )}
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-border text-left">
                    <th className="py-3 pr-6 font-semibold">{t('Route', 'Jalur')}</th>
                    <th className="py-3 pr-6 font-semibold">{t('Where supply comes from', 'Sumber')}</th>
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
            <h2 className="eyebrow text-muted-foreground">{t('How access works', 'Aturan akses')}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Browsing is open', 'Menjelajah terbuka')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Anyone can read About, the ecosystem listings and Discover without signing in.',
                    'Siapa pun bisa membaca About, listing ekosistem dan Discover tanpa masuk.'
                  )}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-display text-lg font-semibold tracking-tight">{t('Acting needs an account', 'Beraksi perlu akun')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(
                    'Applying, bidding, joining a team, booking and buying all sit behind a login wall, and every account goes through onboarding first so nobody appears without a role.',
                    'Apply, bid, gabung tim, booking dan beli semuanya di balik login wall, dan setiap akun melewati onboarding lebih dulu agar tidak ada orang yang muncul tanpa peran.'
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
