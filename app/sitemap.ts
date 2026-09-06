import { supabase } from '@/lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://masmasit.online';

  const staticPages = [
    '', '/directory', '/jobs', '/projects', '/courses', '/events', '/talents',
    '/services', '/case-studies', '/login', '/register', '/privacy-policy', '/terms-of-service',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }));

  const [jobs, projects, courses, events, profiles] = await Promise.all([
    supabase.from('jobs').select('id, updated_at').eq('status', 'open'),
    supabase.from('projects').select('id, updated_at').eq('status', 'open'),
    supabase.from('courses').select('id, updated_at'),
    supabase.from('events').select('id, event_date').gte('event_date', new Date().toISOString()),
    supabase.from('profiles').select('id, updated_at'),
  ]);

  const dynamicPages = [
    ...(jobs.data ?? []).map((j) => ({ url: `${baseUrl}/jobs/${j.id}`, lastModified: new Date(j.updated_at ?? new Date()), changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...(projects.data ?? []).map((p) => ({ url: `${baseUrl}/projects/${p.id}`, lastModified: new Date(p.updated_at ?? new Date()), changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...(courses.data ?? []).map((c) => ({ url: `${baseUrl}/courses/${c.id}`, lastModified: new Date(c.updated_at ?? new Date()), changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...(events.data ?? []).map((e) => ({ url: `${baseUrl}/events/${e.id}`, lastModified: new Date(e.event_date ?? new Date()), changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...(profiles.data ?? []).map((p) => ({ url: `${baseUrl}/directory/${p.id}`, lastModified: new Date(p.updated_at ?? new Date()), changeFrequency: 'monthly' as const, priority: 0.5 })),
  ];

  return [...staticPages, ...dynamicPages];
}
