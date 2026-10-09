import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side helpers for detail-page Open Graph tags. Crawlers (WhatsApp,
 * LinkedIn, X) never run client JS and never carry a session, so the item is
 * read here with the anon key — which works because migration 028 grants
 * guests SELECT on the public listing tables.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://masmasit.online').replace(/\/$/, '');

const DEFAULT_IMAGE = '/icon-512.webp';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Plain anon client: no cookies, no session persistence. Null when env is missing. */
export const getPublicSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

export const isUuid = (value: string) => UUID_PATTERN.test(value);

const getAbsoluteUrl = (pathOrUrl: string) =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

const getExcerpt = (text: string | null | undefined, max = 180) => {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};

interface DetailMetadataInput {
  path: string;
  title: string;
  description?: string | null;
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
}

export const getDetailMetadata = ({ path, title, description, image, type = 'website' }: DetailMetadataInput): Metadata => {
  const url = getAbsoluteUrl(path);
  const desc = getExcerpt(description) || 'MasmasIT — Hybrid IT Community, Talent & Agency Ecosystem.';
  const imageUrl = getAbsoluteUrl(image || DEFAULT_IMAGE);
  const fullTitle = `${title} | MasmasIT`;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: 'MasmasIT',
      type,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: fullTitle,
      description: desc,
      images: [imageUrl],
    },
  };
};

/** Fallback when the item is missing, private, or the query failed. */
export const getFallbackMetadata = (path: string, title: string, description: string): Metadata =>
  getDetailMetadata({ path, title, description });
