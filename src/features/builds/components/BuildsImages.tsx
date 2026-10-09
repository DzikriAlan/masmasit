'use client';

import { X } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { FileUpload } from '@/features/uploads/components/FileUpload';
import { cn } from '@/shared/lib/utils';

export const BUILDS_MAX_IMAGES = 4;

interface PickerProps {
  images: string[];
  onEditImages: (images: string[]) => void;
}

/**
 * Up to four screenshots per build. Files go to the existing public
 * `portfolios` bucket under the uploader's own uid folder (migration 010),
 * so no new storage policy is needed.
 */
export function BuildsImagesPicker({ images, onEditImages }: PickerProps) {
  const { t } = useLang();
  const canAddMore = images.length < BUILDS_MAX_IMAGES;

  const submitImage = (url: string) => {
    if (!url || images.length >= BUILDS_MAX_IMAGES) return;
    onEditImages([...images, url]);
  };

  const clearImage = (index: number) => {
    onEditImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {t('Images (optional)', 'Gambar (opsional)')}{' '}
        <span className="font-normal text-muted-foreground">
          {images.length}/{BUILDS_MAX_IMAGES}
        </span>
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div key={url} className="group relative">
            <img src={url} alt="" className="h-32 w-32 rounded-lg border border-border/60 object-cover" />
            <button
              type="button"
              onClick={() => clearImage(index)}
              aria-label={t('Remove image', 'Hapus gambar')}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {/* Keyed by count so the uploader resets to an empty drop zone after
            every upload instead of holding on to the last preview. */}
        {canAddMore && (
          <FileUpload key={images.length} bucket="portfolios" onUpload={submitImage} existingUrl={null} />
        )}
      </div>
      {!canAddMore && (
        <p className="text-xs text-muted-foreground">
          {t('Maximum of 4 images reached.', 'Maksimal 4 gambar sudah tercapai.')}
        </p>
      )}
    </div>
  );
}

interface GalleryProps {
  images: string[];
  title: string;
}

/** Read-only gallery under a build post: one wide image, or a 2-column grid. */
export function BuildsImagesGallery({ images, title }: GalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn('mt-3 grid gap-2', images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
      {images.map((url, index) => (
        <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border/60">
          <img
            src={url}
            alt={`${title} ${index + 1}`}
            loading="lazy"
            className={cn('w-full object-cover', images.length > 1 ? 'aspect-[4/3]' : 'max-h-80')}
          />
        </a>
      ))}
    </div>
  );
}
