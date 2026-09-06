'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Briefcase, GraduationCap, FolderKanban, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { supabase } from '@/shared/lib/supabase';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  type: 'profile' | 'job' | 'course' | 'project';
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const [profiles, jobs, courses, projects] = await Promise.all([
      supabase.from('profiles').select('id, full_name, bio, location').or(`full_name.ilike.%${q}%,bio.ilike.%${q}%`).limit(5),
      supabase.from('jobs').select('id, title, company_name, location').or(`title.ilike.%${q}%,description.ilike.%${q}%`).eq('status', 'open').limit(5),
      supabase.from('courses').select('id, title, level, category').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(5),
      supabase.from('projects').select('id, title, budget').or(`title.ilike.%${q}%,description.ilike.%${q}%`).eq('status', 'open').limit(5),
    ]);

    const all: SearchResult[] = [];
    (profiles.data ?? []).forEach((p: any) => all.push({ id: p.id, type: 'profile', title: p.full_name ?? 'Unknown', subtitle: p.location ?? p.bio?.slice(0, 50) ?? '', href: `/directory/${p.id}` }));
    (jobs.data ?? []).forEach((j: any) => all.push({ id: j.id, type: 'job', title: j.title, subtitle: `${j.company_name} · ${j.location ?? ''}`, href: `/jobs/${j.id}` }));
    (courses.data ?? []).forEach((c: any) => all.push({ id: c.id, type: 'course', title: c.title, subtitle: `${c.level} · ${c.category ?? ''}`, href: `/courses/${c.id}` }));
    (projects.data ?? []).forEach((p: any) => all.push({ id: p.id, type: 'project', title: p.title, subtitle: p.budget ? `Rp ${(p.budget / 1000000).toFixed(0)}M` : '', href: `/projects/${p.id}` }));
    setResults(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => search(query), 250);
    return () => clearTimeout(handler);
  }, [query, search]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const icons = { profile: User, job: Briefcase, course: GraduationCap, project: FolderKanban };
  const labels = { profile: t('Members', 'Member'), job: t('Jobs', 'Lowongan'), course: t('Courses', 'Kursus'), project: t('Projects', 'Proyek') };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/40 p-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search members, jobs, courses, projects...', 'Cari member, lowongan, kursus, proyek...')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {query.length < 2 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('Start typing to search...', 'Mulai mengetik untuk mencari...')}</p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('No results found', 'Tidak ada hasil')}</p>
            ) : (
              results.map((r) => {
                const Icon = icons[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r.href)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{labels[r.type]}</Badge>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
