'use client';

import { useEffect, useState } from 'react';
import { Search, MapPin, Users, Loader2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLang } from '@/components/language-provider';
import type { UserProfile, Skill } from '@/shared/lib/types';

interface DirectoryMember extends UserProfile {
  user_skills?: { level: string; skills: { name: string } }[];
  _isDummy?: boolean;
}

const dummyMembers: DirectoryMember[] = [
  { id: 'dummy-m1', full_name: 'Andi Pratama', bio: 'Full-Stack Developer specializing in Next.js and PostgreSQL. Building SaaS products for the Indonesian market.', avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Jakarta', current_job_status: 'Employed', user_skills: [{ level: 'expert', skills: { name: 'React' } }, { level: 'expert', skills: { name: 'Node.js' } }, { level: 'intermediate', skills: { name: 'PostgreSQL' } }], _isDummy: true } as any,
  { id: 'dummy-m2', full_name: 'Maya Anggraini', bio: 'UI/UX Designer & Frontend Developer. Passionate about creating accessible and beautiful digital experiences.', avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Bandung', current_job_status: 'Freelancing', user_skills: [{ level: 'expert', skills: { name: 'Figma' } }, { level: 'intermediate', skills: { name: 'React' } }, { level: 'beginner', skills: { name: 'TailwindCSS' } }], _isDummy: true } as any,
  { id: 'dummy-m3', full_name: 'Reza Kurniawan', bio: 'DevOps Engineer with a passion for automation. AWS Certified Solutions Architect. Docker & Kubernetes enthusiast.', avatar_url: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Surabaya', current_job_status: 'Open to opportunities', user_skills: [{ level: 'expert', skills: { name: 'Docker' } }, { level: 'expert', skills: { name: 'Kubernetes' } }, { level: 'intermediate', skills: { name: 'AWS' } }], _isDummy: true } as any,
  { id: 'dummy-m4', full_name: 'Putri Maharani', bio: 'Data Scientist & ML Engineer. Building predictive models and data pipelines. Python, TensorFlow, and BigQuery.', avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Yogyakarta', current_job_status: 'Employed', user_skills: [{ level: 'expert', skills: { name: 'Python' } }, { level: 'intermediate', skills: { name: 'TensorFlow' } }, { level: 'intermediate', skills: { name: 'SQL' } }], _isDummy: true } as any,
  { id: 'dummy-m5', full_name: 'Bayu Setiawan', bio: 'Mobile Developer (Flutter & Kotlin). 5 years building production apps with millions of downloads.', avatar_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Medan', current_job_status: 'Looking for work', user_skills: [{ level: 'expert', skills: { name: 'Flutter' } }, { level: 'intermediate', skills: { name: 'Kotlin' } }], _isDummy: true } as any,
  { id: 'dummy-m6', full_name: 'Citra Dewi', bio: 'Product Manager transitioning from software engineering. Building products that solve real Indonesian problems.', avatar_url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Bali', current_job_status: 'Employed', user_skills: [{ level: 'intermediate', skills: { name: 'Product Management' } }, { level: 'beginner', skills: { name: 'React' } }], _isDummy: true } as any,
];

export default function DirectoryPage() {
  const { t } = useLang();
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const { data: skillsData } = await supabase.from('skills').select('*').order('name');
      if (skillsData) setSkills(skillsData as Skill[]);
      await loadMembers();
    })();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*, user_skills(level, skills(name))');

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);
    }
    if (locationFilter !== 'all') {
      query = query.eq('location', locationFilter);
    }
    if (statusFilter !== 'all') {
      query = query.eq('current_job_status', statusFilter);
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(60);
    const dbMembers = (data as DirectoryMember[]) ?? [];
    const realIds = new Set(dbMembers.map((m) => m.id));
    const merged = [...dbMembers, ...dummyMembers.filter((d) => !realIds.has(d.id))];
    setMembers(merged);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadMembers, 300);
    return () => clearTimeout(timeout);
  }, [search, locationFilter, statusFilter]);

  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Makassar', 'Bali', 'Online'];
  const statuses = ['Employed', 'Freelancing', 'Looking for work', 'Open to opportunities', 'Student'];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('Member Directory', 'Direktori Member')}</h1>
          <p className="mt-1 text-muted-foreground">{t('Connect with IT practitioners across Indonesia.', 'Terhubung dengan praktisi IT di seluruh Indonesia.')}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Search by name or bio...', 'Cari berdasarkan nama atau bio...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger><SelectValue placeholder={t('Location', 'Lokasi')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Locations', 'Semua Lokasi')}</SelectItem>
              {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder={t('Status', 'Status')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Statuses', 'Semua Status')}</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger><SelectValue placeholder={t('Skill', 'Skill')} /></SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">{t('All Skills', 'Semua Skill')}</SelectItem>
              {skills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>{t('No members found matching your filters.', 'Tidak ada member yang cocok dengan filter Anda.')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members
              .filter((m) => {
                if (skillFilter === 'all') return true;
                return m.user_skills?.some((us) => us.skills?.name === skills.find((s) => s.id === skillFilter)?.name);
              })
              .map((m) => (
                <Link key={m.id} href={`/directory/${m.id}`}>
                  <Card className="glass group h-full transition-all hover:border-primary/40 hover:-translate-y-0.5">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-base font-bold overflow-hidden">
                          {m.avatar_url ? <img src={m.avatar_url} alt={m.full_name ?? ''} className="h-12 w-12 rounded-full object-cover" /> : m.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate font-semibold">{m.full_name ?? 'Anonymous'}</h3>
                          {m.location && (
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {m.location}
                            </p>
                          )}
                        </div>
                      </div>
                      {m.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{m.bio}</p>}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.user_skills?.slice(0, 3).map((us, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{us.skills?.name}</Badge>
                        ))}
                        {(m.user_skills?.length ?? 0) > 3 && (
                          <Badge variant="outline" className="text-xs">+{m.user_skills!.length - 3}</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {m.current_job_status && (
                          <span className="text-xs text-muted-foreground">{m.current_job_status}</span>
                        )}
                        {m.is_talent && m.talent_approved === 'approved' && (
                          <Badge variant="default" className="gap-1 text-xs"><LinkIcon className="h-3 w-3" /> Talent</Badge>
                        )}
                      </div>
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
