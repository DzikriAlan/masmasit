'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, MessageCircle, Mail, ArrowUpRight } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL, waLink } from '@/shared/lib/external';
import { toneOf } from '@/shared/lib/tones';
import { TONE_CHIP } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

/**
 * Contact Us used to drop straight into WhatsApp from the header, with no
 * page and no way to see the other options. This is that page: every
 * channel stated with the one thing people actually want to know first —
 * how long a reply takes.
 */
export default function ContactList() {
  const { t } = useLang();
  const [filters, setFilters] = useState({ isEmailCopied: false });

  const data = useMemo(() => {
    const channels = [
      {
        key: 'whatsapp',
        title: 'WhatsApp',
        description: t('Quickest for a question about the platform.', 'Paling cepat untuk pertanyaan soal platform.'),
        meta: t('Usually replies within an hour', 'Biasanya dibalas dalam 1 jam'),
        href: waLink(t('Hi MasmasIT, I would like to know more.', 'Halo MasmasIT, saya ingin tahu lebih lanjut.')),
        actionLabel: t('Open WhatsApp', 'Buka WhatsApp'),
        isExternal: true,
      },
      {
        key: 'email',
        title: t('Email', 'Email'),
        description: t('Best for partnerships, invoices and anything with attachments.', 'Cocok untuk kerja sama, invoice, dan hal yang perlu lampiran.'),
        meta: CONTACT_EMAIL,
        href: `mailto:${CONTACT_EMAIL}`,
        actionLabel: t('Send an email', 'Kirim email'),
        isExternal: false,
      },
    ];

    return { channels };
  }, [t]);

  const editContactEmailCopied = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setFilters((prev) => ({ ...prev, isEmailCopied: true }));
      setTimeout(() => setFilters((prev) => ({ ...prev, isEmailCopied: false })), 2000);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Contact', 'Kontak')}
          tone={toneOf('about')}
          title={t('Contact us', 'Hubungi kami')}
          subtitle={t(
            'A real person reads these. Pick whichever channel suits what you need.',
            'Dibaca orang sungguhan. Pilih kanal yang paling sesuai kebutuhanmu.'
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {data.channels.map((channel) => (
            <div key={channel.key} className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', TONE_CHIP[toneOf('about')])}>
                {channel.key === 'whatsapp' ? <MessageCircle className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
              </div>

              <h2 className="mt-4 font-semibold">{channel.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">{channel.description}</p>
              <p className="mt-3 truncate text-xs text-muted-foreground">{channel.meta}</p>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <a
                  href={channel.href}
                  {...(channel.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <Button size="sm" className="gap-1.5">
                    {channel.actionLabel}
                    {channel.isExternal && <ArrowUpRight className="h-3.5 w-3.5" />}
                  </Button>
                </a>

                {channel.key === 'email' && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={editContactEmailCopied}>
                    {filters.isEmailCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {filters.isEmailCopied ? t('Copied', 'Disalin') : t('Copy address', 'Salin alamat')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-xl border border-border bg-secondary/40 p-5">
          <h2 className="font-semibold">{t('Looking for something specific?', 'Mencari sesuatu yang spesifik?')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
            {t(
              'Hiring, quoting a project, or joining as a practitioner each have their own place on the platform.',
              'Merekrut, meminta penawaran proyek, atau bergabung sebagai praktisi punya tempatnya masing-masing.'
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/jobs/post">
              <Button variant="outline" size="sm">{t('Post a job', 'Pasang lowongan')}</Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" size="sm">{t('Request a project', 'Minta proyek')}</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm">{t('Join as a member', 'Gabung jadi member')}</Button>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
