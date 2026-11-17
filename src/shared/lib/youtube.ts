const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
const VIDEO_ID = /^[\w-]{11}$/;

/** "1h2m30s", "90s" or "90" → seconds. */
const getStartSeconds = (value: string | null) => {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  const [, h = '0', m = '0', s = '0'] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

/**
 * YouTube link in any common shape (watch?v=, youtu.be, shorts, live, embed,
 * mobile, with &t= / ?si= / &list= extras) → embeddable iframe URL.
 * Returns null when the URL is not a YouTube video.
 */
export const getYoutubeEmbedUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  let parsed: URL;
  try {
    // Pasted without a scheme, e.g. "youtube.com/watch?v=…".
    parsed = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);
  let id: string | undefined;
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    id = segments[0];
  } else if (YOUTUBE_HOSTS.includes(host)) {
    id = segments[0] === 'watch' || !segments.length
      ? parsed.searchParams.get('v') ?? undefined
      : ['embed', 'shorts', 'live', 'v'].includes(segments[0]) ? segments[1] : undefined;
  }
  if (!id || !VIDEO_ID.test(id)) return null;

  const start = getStartSeconds(parsed.searchParams.get('t') ?? parsed.searchParams.get('start'));
  const embed = new URL(`https://www.youtube.com/embed/${id}`);
  embed.searchParams.set('rel', '0');
  if (start) embed.searchParams.set('start', String(start));
  return embed.toString();
};
