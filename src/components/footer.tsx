'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLang } from '@/components/language-provider';
import { cn } from '@/shared/lib/utils';

const WA_HREF = 'https://wa.me/6281234567890';
const EMAIL = 'hello@masmasit.online';

export function Footer() {
  const { t } = useLang();
  // White footer. On the homepage it sits right under the dark CTA, whose
  // edge is divider enough; on other pages a hairline separates it from the
  // canvas.
  const isHome = usePathname() === '/';

  // Legal links live in the bottom bar, not mixed into product navigation.
  const groups = [
    {
      title: t('Community', 'Komunitas'),
      links: [
        { href: '/directory', label: t('Members', 'Anggota') },
        { href: '/jobs', label: t('Jobs', 'Lowongan') },
        { href: '/projects', label: t('Projects', 'Proyek') },
        { href: '/courses', label: 'LMS' },
        { href: '/events', label: 'Events' },
      ],
    },
    {
      title: 'Talent & Agency',
      links: [
        { href: '/talents', label: 'Talents' },
        { href: '/services', label: t('Services', 'Layanan') },
        { href: '/case-studies', label: t('Case Studies', 'Studi Kasus') },
      ],
    },
    {
      title: t('Contact', 'Kontak'),
      links: [
        { href: WA_HREF, label: 'WhatsApp', external: true },
        { href: `mailto:${EMAIL}`, label: EMAIL, external: true },
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
            {/* Same text-only wordmark as the navbar. */}
            <Link href="/" aria-label="MasmasIT home" className="block w-fit font-brand text-[26px] font-extrabold leading-none tracking-[-0.035em]">
              MasmasIT
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
              {t(
                'IT Community, Talent & Agency Ecosystem for Indonesian practitioners.',
                'Komunitas IT, Talent & Agency untuk praktisi Indonesia.'
              )}
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8" aria-label={t('Footer', 'Footer')}>
            {groups.map((g) => (
              <div key={g.title} className={g.title === t('Contact', 'Kontak') ? 'col-span-2 sm:col-span-1' : ''}>
                <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{g.title}</h4>
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

      {/* Oversized ink wordmark as the sign-off; decorative only. */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p
          className="-mb-[0.22em] text-center font-display font-bold leading-none tracking-tighter text-transparent"
          style={{
            fontSize: 'min(21vw, 17rem)',
            // Smooth ink: near-black easing to a softer charcoal at the clipped base.
            backgroundImage: 'linear-gradient(to bottom, hsl(240 10% 8%) 0%, hsl(240 6% 22%) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          MasmasIT
        </p>
      </div>
    </footer>
  );
}
