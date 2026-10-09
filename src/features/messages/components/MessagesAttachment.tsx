'use client';

import { FileText, Loader2 } from 'lucide-react';
import { useLang } from '@/components/language-provider';

import type { DataMessages } from '@/features/messages/types/messagesTypes';
import { useMessagesAttachmentControllers } from '@/features/messages/controllers/messagesControllers';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Renders a message's attachment inside its bubble. The bucket is private, so
 * the stored path is resolved to a signed URL first; images preview inline,
 * anything else is a download link.
 */
export function MessagesAttachment({ message, isMine }: { message: DataMessages; isMine: boolean }) {
  const { t } = useLang();
  const { fetchMessagesAttachmentUrl } = useMessagesAttachmentControllers(message.attachment_url);
  const url = fetchMessagesAttachmentUrl.data;
  const isImage = (message.attachment_type ?? '').startsWith('image/');
  const name = message.attachment_name ?? t('Attachment', 'Lampiran');

  if (fetchMessagesAttachmentUrl.isPending) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs opacity-70">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('Loading attachment...', 'Memuat lampiran...')}
      </div>
    );
  }

  if (!url) {
    return <p className="py-1 text-xs opacity-70">{t('Attachment unavailable', 'Lampiran tidak tersedia')}</p>;
  }

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mb-1 block">
        <img src={url} alt={name} className="max-h-64 max-w-full rounded-lg object-cover" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs underline-offset-2 hover:underline ${
        isMine ? 'bg-primary-foreground/10' : 'bg-background/60'
      }`}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{name}</span>
      {message.attachment_size ? <span className="shrink-0 opacity-70">{formatSize(message.attachment_size)}</span> : null}
    </a>
  );
}
