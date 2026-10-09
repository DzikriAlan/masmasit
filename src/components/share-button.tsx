'use client';

import { useEffect, useMemo, useState } from 'react';
import { Share2, Link2, MessageCircle, Linkedin, AtSign } from 'lucide-react';
import { toast } from 'sonner';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  /** Absolute URL, or a path such as `/jobs/123` (resolved against the site origin). */
  url: string;
  title: string;
  text?: string;
}

function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

/**
 * Share a detail page: copy link, WhatsApp, LinkedIn, X and Threads. On touch
 * devices with the Web Share API the OS share sheet is used instead.
 */
export function ShareButton({ url, title, text }: Props) {
  const { t } = useLang();
  const [filters, setFilters] = useState({ origin: process.env.NEXT_PUBLIC_SITE_URL ?? '', isNativeShare: false });

  const data = useMemo(() => {
    const getAbsoluteUrl = () => {
      if (/^https?:\/\//.test(url)) return url;
      const base = filters.origin.replace(/\/$/, '');
      return `${base}${url.startsWith('/') ? url : `/${url}`}`;
    };
    const shareUrl = getAbsoluteUrl();
    const message = text ? `${title} — ${text}` : title;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedMessage = encodeURIComponent(message);

    return {
      shareUrl,
      message,
      links: [
        { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(`${message} ${shareUrl}`)}` },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
        { key: 'x', label: 'X', icon: XGlyph, href: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}` },
        { key: 'threads', label: 'Threads', icon: AtSign, href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${message} ${shareUrl}`)}` },
      ],
    };
  }, [url, title, text, filters.origin]);

  const submitCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success(t('Link copied', 'Tautan disalin'));
    } catch {
      toast.error(t('Could not copy the link', 'Gagal menyalin tautan'));
    }
  };

  const submitNativeShare = async () => {
    try {
      await navigator.share({ title, text: text ?? title, url: data.shareUrl });
    } catch (error) {
      // AbortError = the user closed the sheet; anything else falls back to copy.
      if (!(error instanceof Error && error.name === 'AbortError')) await submitCopyLink();
    }
  };

  useEffect(() => {
    const isTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    setFilters({
      origin: process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
      isNativeShare: isTouch && typeof navigator.share === 'function',
    });
  }, []);

  if (filters.isNativeShare) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={submitNativeShare}>
        <Share2 className="h-4 w-4" /> {t('Share', 'Bagikan')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" /> {t('Share', 'Bagikan')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={submitCopyLink} className="gap-2">
          <Link2 className="h-4 w-4" /> {t('Copy link', 'Salin tautan')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {data.links.map((link) => (
          <DropdownMenuItem key={link.key} asChild className="gap-2">
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              <link.icon className="h-4 w-4" /> {link.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ShareButton;
