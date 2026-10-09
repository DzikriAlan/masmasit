/**
 * Shrinks an image in the browser before it is uploaded, so Storage holds a
 * small WebP instead of the phone photo the member picked.
 *
 * The longest side is capped at `maxDimension` (never enlarged) and the
 * result is encoded as WebP; browsers that cannot encode WebP (older Safari)
 * fall back to JPEG. Transparent PNGs get a white background, which suits
 * avatars, logos and screenshots on this site's light cards.
 */
export interface CompressedImage {
  blob: Blob;
  type: 'image/webp' | 'image/jpeg';
  extension: 'webp' | 'jpg';
}

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unreadable image'));
    };
    img.src = url;
  });

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export const compressImage = async (
  file: File,
  { maxDimension = 1600, quality = 0.8 }: { maxDimension?: number; quality?: number } = {}
): Promise<CompressedImage> => {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const webp = await toBlob(canvas, 'image/webp', quality);
  if (webp && webp.type === 'image/webp') return { blob: webp, type: 'image/webp', extension: 'webp' };

  const jpeg = await toBlob(canvas, 'image/jpeg', quality);
  if (!jpeg) throw new Error('Could not encode image');
  return { blob: jpeg, type: 'image/jpeg', extension: 'jpg' };
};
