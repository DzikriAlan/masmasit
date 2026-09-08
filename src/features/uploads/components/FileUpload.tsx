'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2, X, ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { toast } from 'sonner';

import { useUploadsControllers } from '@/features/uploads/controllers/uploadsControllers';

interface FileUploadProps {
  bucket: 'avatars' | 'company-logos' | 'portfolios' | 'certificates';
  onUpload: (url: string) => void;
  existingUrl?: string | null;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  bucket,
  onUpload,
  existingUrl,
  label,
  accept = 'image/png,image/jpeg,image/webp',
  maxSizeMB = 2,
  className = '',
}: FileUploadProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { storeUploads } = useUploadsControllers();
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [dragOver, setDragOver] = useState(false);

  const saveFile = useCallback(async (file: File) => {
    if (!user) {
      toast.error(t('Please sign in to upload', 'Silakan masuk untuk upload'));
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('Only JPG, PNG, and WebP files are allowed', 'Hanya JPG, PNG, dan WebP yang diperbolehkan'));
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t(`File must be under ${maxSizeMB}MB`, `File harus di bawah ${maxSizeMB}MB`));
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    let uploaded: { publicUrl: string };
    try {
      uploaded = await storeUploads.mutateAsync({ bucket, path, file });
    } catch (error) {
      setUploading(false);
      const message = error instanceof Error ? error.message : '';
      toast.error(t('Upload failed', 'Upload gagal') + (message ? `: ${message}` : ''));
      return;
    }

    setPreview(uploaded.publicUrl);
    onUpload(uploaded.publicUrl);
    setUploading(false);
    toast.success(t('Upload complete', 'Upload selesai'));
  }, [user, bucket, maxSizeMB, onUpload, t, storeUploads]);

  const modifyDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) saveFile(file);
  }, [saveFile]);

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
  };

  return (
    <div className={className}>
      {label && <label className="mb-2 block text-sm font-medium">{label}</label>}
      {preview ? (
        <div className="relative group">
          <img src={preview} alt="Preview" className="h-32 w-32 rounded-lg object-cover border border-border/60" />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={modifyDrop}
          className={`flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              {dragOver ? <Upload className="h-6 w-6 text-primary" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
              <span className="mt-1.5 text-xs text-muted-foreground text-center px-2">
                {t('Click or drag to upload', 'Klik atau seret untuk upload')}
              </span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) saveFile(file);
        }}
      />
    </div>
  );
}
