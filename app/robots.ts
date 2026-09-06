import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/profile', '/pesan', '/onboarding', '/coach'] },
    sitemap: 'https://masmasit.online/sitemap.xml',
  };
}
