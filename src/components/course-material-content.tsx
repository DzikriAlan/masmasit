'use client';

import { ExternalLink } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { getYoutubeEmbedUrl } from '@/shared/lib/youtube';

/** Body of one course material: YouTube iframe / video player, file link, or text. */
export function CourseMaterialContent({
  title,
  contentType,
  contentUrl,
  textContent,
}: Readonly<{
  title: string;
  contentType: string;
  contentUrl: string | null;
  textContent: string | null;
}>) {
  const { t } = useLang();
  const youtubeEmbedUrl = getYoutubeEmbedUrl(contentUrl);
  const emptyText = t('No content available.', 'Tidak ada konten.');

  if (contentType === 'video' && contentUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title={title}
          />
        ) : (
          <video src={contentUrl} controls className="h-full w-full">
            <source src={contentUrl} />
          </video>
        )}
      </div>
    );
  }

  if (contentType === 'file' && contentUrl) {
    return (
      <a href={contentUrl} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm" className="gap-2">
          <ExternalLink className="h-3.5 w-3.5" /> {t('Open File', 'Buka File')}
        </Button>
      </a>
    );
  }

  if (contentType === 'text') {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {textContent || emptyText}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">{emptyText}</p>;
}
