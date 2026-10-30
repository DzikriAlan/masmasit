import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/app/admin', '/app/dashboard', '/app/profile', '/app/pesan', '/app/onboarding', '/app/coach'] },
    sitemap: 'https://masmasit.online/sitemap.xml',
  };
}
