'use client';

import { useEffect, useState } from 'react';
import { Star, MapPin, Loader2, CalendarClock, Link as LinkIcon, Search } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLang } from '@/components/language-provider';

interface Talent {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  linkedin_url: string | null;
  calendly_url: string | null;
  whatsapp: string | null;
  _isDummy?: boolean;
}

const dummyTalents: Talent[] = [
  { id: 'dummy-t1', full_name: 'Rani Saraswati', bio: 'Senior UX Designer with 6 years at Tokopedia and Gojek. I help designers build portfolios that get hired and teach UX research methods.', avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Bandung, Indonesia', linkedin_url: 'https://linkedin.com/in/ranisaraswati', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t2', full_name: 'Budi Hartono', bio: 'DevOps Engineer & AWS Solutions Architect. 10 years scaling infrastructure for Indonesian unicorns. I mentor on cloud, CI/CD, and SRE practices.', avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Jakarta, Indonesia', linkedin_url: 'https://linkedin.com/in/budihartono', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t3', full_name: 'Siti Rahayu', bio: 'Data Scientist & ML Engineer. PhD in Computer Science from ITB. I help beginners break into data science with practical, project-based learning.', avatar_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Surabaya, Indonesia', linkedin_url: 'https://linkedin.com/in/sitirahayu', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t4', full_name: 'Ahmad Fauzi', bio: 'Senior Mobile Developer (Flutter & React Native). Shipped 20+ apps with 4.5+ star ratings. I coach on mobile architecture and app store optimization.', avatar_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Yogyakarta, Indonesia', linkedin_url: 'https://linkedin.com/in/ahmadfauzi', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t5', full_name: 'Dewi Lestari', bio: 'Product Manager ex-Ruangguru. I help aspiring PMs master product discovery, user research, and data-driven decision making.', avatar_url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Jakarta, Indonesia', linkedin_url: 'https://linkedin.com/in/dewilestari', calendly_url: null, whatsapp: null, _isDummy: true },
];

export default function TalentsPage() {
  const { t } = useLang();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, location, linkedin_url, calendly_url, whatsapp')
        .eq('is_talent', true)
        .eq('talent_approved', 'approved')
        .order('created_at', { ascending: false });
      const dbTalents = (data as Talent[]) ?? [];
      const realNames = new Set(dbTalents.map((t2) => t2.full_name?.toLowerCase()));
      const merged = [...dbTalents, ...dummyTalents.filter((d) => !realNames.has(d.full_name?.toLowerCase()))];
      setTalents(merged);
      setLoading(false);
    })();
  }, []);

  const filtered = talents.filter((tal) =>
    !search ||
    tal.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    tal.bio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('Talent Listing', 'Daftar Talent')}</h1>
          <p className="mt-1 text-muted-foreground">{t('Book 1-on-1 consultations and mentoring sessions with vetted Indonesian IT experts.', 'Pesan konsultasi 1-on-1 dan mentoring dengan ahli IT Indonesia terverifikasi.')}</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('Search talent...', 'Cari talent...')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Star className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>{t('No talent profiles available yet.', 'Belum ada profil talent.')}</p>
            <Link href="/coach" className="mt-4 inline-block"><Button variant="outline" size="sm">{t('Become a Talent', 'Jadilah Talent')}</Button></Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tal) => (
              <Card key={tal.id} className="glass group transition-all hover:border-primary/40 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-lg font-bold">
                      {tal.avatar_url ? <img src={tal.avatar_url} alt={tal.full_name ?? ''} className="h-14 w-14 rounded-full object-cover" /> : tal.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{tal.full_name ?? 'Anonymous'}</h3>
                      {tal.location && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" /> {tal.location}</p>}
                    </div>
                    <Badge variant="default" className="gap-1"><Star className="h-3 w-3 text-amber-400" /> {t('Talent', 'Talent')}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{tal.bio ?? t('IT professional ready to help.', 'Profesional IT siap membantu.')}</p>
                  <div className="mt-4 flex gap-2">
                    {tal.linkedin_url && (
                      <a href={tal.linkedin_url} target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2"><LinkIcon className="h-3.5 w-3.5" /> LinkedIn</Button>
                      </a>
                    )}
                    <Link href={`/talents/${tal.id}`} className="flex-1">
                      <Button size="sm" className="w-full gap-2"><CalendarClock className="h-3.5 w-3.5" /> {t('Book', 'Pesan')}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
