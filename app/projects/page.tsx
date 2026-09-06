'use client';

import { useEffect, useState } from 'react';
import { Search, Code2, Wallet, Clock, Loader2, Plus, ArrowLeft, Send, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProjectWithOwner {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export default function ProjectsPage() {
  const { t } = useLang();
  const [projects, setProjects] = useState<ProjectWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [showPost, setShowPost] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ title: '', description: '', budget_min: '', budget_max: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    let query = supabase
      .from('projects')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data } = await query.limit(50);
    setProjects((data as ProjectWithOwner[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadProjects, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handlePost = async () => {
    if (!user) { router.push('/login'); return; }
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      budget_min: form.budget_min ? parseInt(form.budget_min) : null,
      budget_max: form.budget_max ? parseInt(form.budget_max) : null,
      deadline: form.deadline || null,
    });
    setSaving(false);
    if (error) { toast.error(t('Failed to post project', 'Gagal memposting proyek')); return; }
    toast.success(t('Project posted!', 'Proyek diposting!'));
    setShowPost(false);
    setForm({ title: '', description: '', budget_min: '', budget_max: '', deadline: '' });
    loadProjects();
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return t('Negotiable', 'Negosiasi');
    if (min && max) return `Rp ${(min / 1000000).toFixed(1)}-${(max / 1000000).toFixed(1)}M`;
    if (min) return `Rp ${(min / 1000000).toFixed(1)}M+`;
    return `Up to Rp ${(max! / 1000000).toFixed(1)}M`;
  };

  const projectImages: Record<string, string> = {
    'web': 'https://images.pexels.com/photos/1966452/pexels-photo-1966452.jpeg?auto=compress&cs=tinysrgb&h=160&w=400',
    'mobile': 'https://images.pexels.com/photos/6078123/pexels-photo-6078123.jpeg?auto=compress&cs=tinysrgb&h=160&w=400',
    'ai': 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&h=160&w=400',
    'data': 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&h=160&w=400',
    'design': 'https://images.pexels.com/photos/1966444/pexels-photo-1966444.jpeg?auto=compress&cs=tinysrgb&h=160&w=400',
    default: 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&h=160&w=400',
  };
  const getProjectImage = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('web') || lower.includes('website')) return projectImages.web;
    if (lower.includes('mobile') || lower.includes('app')) return projectImages.mobile;
    if (lower.includes('ai') || lower.includes('ml') || lower.includes('chatbot')) return projectImages.ai;
    if (lower.includes('data') || lower.includes('pipeline')) return projectImages.data;
    if (lower.includes('design') || lower.includes('ui')) return projectImages.design;
    return projectImages.default;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('Project Portal', 'Portal Proyek')}</h1>
            <p className="mt-1 text-muted-foreground">{t('Outsource work or find freelance IT projects — all budgets in Rupiah, no middleman.', 'Outsource pekerjaan atau temukan proyek IT freelance — semua budget dalam Rupiah, tanpa perantara.')}</p>
          </div>
          <Button onClick={() => user ? setShowPost(!showPost) : router.push('/login')} className="gap-2">
            <Plus className="h-4 w-4" /> {t('Post Project', 'Pasang Proyek')}
          </Button>
        </div>

        {showPost && (
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="font-display">{t('Post a New Project', 'Pasang Proyek Baru')}</CardTitle>
              <CardDescription>{t('Describe what you need and let members bid.', 'Jelaskan kebutuhan Anda dan biarkan member menawar.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="ptitle">{t('Title', 'Judul')}</Label><Input id="ptitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('E-commerce website development', 'Pengembangan website e-commerce')} /></div>
              <div className="space-y-2"><Label htmlFor="pdesc">{t('Description', 'Deskripsi')}</Label><Textarea id="pdesc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('Detailed project scope...', 'Detail scope proyek...')} className="min-h-[120px]" /></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="pbmin">{t('Budget Min (IDR)', 'Budget Min (IDR)')}</Label><Input id="pbmin" type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} placeholder="5000000" /></div>
                <div className="space-y-2"><Label htmlFor="pbmax">{t('Budget Max (IDR)', 'Budget Max (IDR)')}</Label><Input id="pbmax" type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} placeholder="15000000" /></div>
                <div className="space-y-2"><Label htmlFor="pdead">{t('Deadline', 'Tenggat')}</Label><Input id="pdead" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPost(false)}>{t('Cancel', 'Batal')}</Button>
                <Button onClick={handlePost} disabled={saving || !form.title || !form.description} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('Post Project', 'Pasang Proyek')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t('Search projects...', 'Cari proyek...')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            {['open', 'in_progress', 'completed', 'all'].map((s) => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
                {s.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Code2 className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>{t('No projects found.', 'Tidak ada proyek ditemukan.')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                  <div className="relative h-28 overflow-hidden">
                    <img src={getProjectImage(p.title)} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <Badge variant={p.status === 'open' ? 'default' : 'secondary'} className="absolute top-3 left-3 capitalize text-xs backdrop-blur-md">{p.status.replace('_', ' ')}</Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="truncate font-semibold">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={p.status === 'open' ? 'default' : 'secondary'} className="capitalize text-xs">{p.status.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className="gap-1 text-xs"><Wallet className="h-3 w-3" /> {formatBudget(p.budget_min, p.budget_max)}</Badge>
                      {p.deadline && <Badge variant="outline" className="gap-1 text-xs"><Clock className="h-3 w-3" /> {new Date(p.deadline).toLocaleDateString('id-ID')}</Badge>}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t('by', 'oleh')} {p.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
