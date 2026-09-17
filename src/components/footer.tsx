'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLang } from '@/components/language-provider';
import { CONTACT_EMAIL, waLink } from '@/shared/lib/external';
import { cn } from '@/shared/lib/utils';
import mmitLogo from '@/shared/images/mmit-transparent.png';

const WA_HREF = waLink('Halo MasmasIT, saya ingin bertanya.');

export function Footer() {
  const { t } = useLang();
  // White footer. On the homepage it sits right under the dark CTA, whose
  // edge is divider enough; on other pages a hairline separates it from the
  // canvas.
  const isHome = usePathname() === '/';

  // Legal links live in the bottom bar, not mixed into product navigation.
  // Mirrors the header: Product, then the ecosystem split into work/business
  // and community, then Discover and contact.
  const groups = [
    {
      title: 'Product',
      links: [
        { href: '/about', label: t('About', 'Tentang') },
        { href: '/team-builder', label: 'Team Builder' },
        { href: '/spotlight', label: 'Spotlight' },
      ],
    },
    {
      title: t('Work & Business', 'Kerja & Bisnis'),
      links: [
        { href: '/jobs', label: t('Jobs', 'Lowongan') },
        { href: '/projects', label: t('Projects', 'Proyek') },
        { href: '/team-collabs', label: 'Team Collabs' },
        { href: '/talents', label: 'Talent' },
        { href: '/courses', label: t('Courses', 'Kursus') },
        { href: '/agency', label: 'Agency' },
        { href: '/services', label: t('Services', 'Layanan') },
      ],
    },
    {
      title: t('Community', 'Komunitas'),
      links: [
        { href: '/discussions', label: t('Discussions', 'Diskusi') },
        { href: '/directory', label: t('Members', 'Member') },
        { href: '/builds', label: 'Builds' },
        { href: '/events', label: 'Events' },
        { href: '/discover', label: 'Discover' },
      ],
    },
    {
      title: t('Contact', 'Kontak'),
      links: [
        { href: WA_HREF, label: 'WhatsApp', external: true },
        { href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL, external: true },
      ],
    },
  ];

  return (
    <footer
      className={cn(
        'relative overflow-hidden bg-white text-foreground',
        !isHome && 'mt-16 border-t border-border'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/* Same logomark + wordmark as the navbar. Footer is always on
                the white canvas, so the ink-on-white mark always applies —
                no dark-hero swap needed here. */}
            <Link href="/" aria-label="MasmasIT home" className="flex w-fit items-center gap-2.5">
              <img src={mmitLogo.src} alt="" aria-hidden className="h-7 w-auto shrink-0" />
              <span className="font-brand text-[26px] font-extrabold leading-none tracking-[-0.035em]">
                MasmasIT
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
              {t(
                'IT Community, Talent & Agency Ecosystem for Indonesian practitioners.',
                'Komunitas IT, Talent & Agency untuk praktisi Indonesia.'
              )}
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8" aria-label={t('Footer', 'Footer')}>
            {groups.map((g) => (
              <div key={g.title} className={g.title === t('Contact', 'Kontak') ? 'col-span-2 sm:col-span-1' : ''}>
                <h4 className="eyebrow text-muted-foreground">{g.title}</h4>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      {'external' in l ? (
                        <a
                          href={l.href}
                          target={l.href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          className="whitespace-nowrap text-foreground/80 transition-colors hover:text-foreground"
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className="text-foreground/80 transition-colors hover:text-foreground">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col-reverse gap-4 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} MasmasIT · {t('Built for Indonesian IT practitioners', 'Dibangun untuk praktisi IT Indonesia')}
          </p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
              {t('Privacy Policy', 'Kebijakan Privasi')}
            </Link>
            <Link href="/terms-of-service" className="transition-colors hover:text-foreground">
              {t('Terms of Service', 'Syarat Layanan')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
