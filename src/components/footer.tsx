'use client';

import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';

import { useLang } from '@/components/language-provider';

const WA_HREF = 'https://wa.me/6281234567890';
const EMAIL = 'hello@masmasit.online';

export function Footer() {
  const { t } = useLang();

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
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex w-fit items-center gap-2.5">
              <img src="/icon-192.webp" alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-[24%]" />
              <span className="font-display text-lg font-bold">
                masmasit<span className="text-primary">.online</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
              {t(
                'IT Community, Talent & Agency Ecosystem for Indonesian practitioners.',
                'Komunitas IT, Talent & Agency untuk praktisi Indonesia.'
              )}
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href={WA_HREF}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${EMAIL}`}
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
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
            &copy; {new Date().getFullYear()} masmasit.online · {t('Built for Indonesian IT practitioners', 'Dibangun untuk praktisi IT Indonesia')}
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

      {/* Oversized wordmark as a quiet sign-off; decorative only. */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p
          className="-mb-[0.22em] text-center font-display font-bold leading-none tracking-tighter text-transparent"
          style={{
            fontSize: 'min(21vw, 17rem)',
            backgroundImage: 'linear-gradient(to bottom, hsl(var(--foreground) / 0.09), hsl(var(--foreground) / 0))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          masmasit
        </p>
      </div>
    </footer>
  );
}
