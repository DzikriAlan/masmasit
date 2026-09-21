'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

import type { Talent } from '@/features/talents/types/talentsTypes';
import { useTalentsControllers } from '@/features/talents/controllers/talentsControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { signedOutState } from '@/shared/lib/browse-gate';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';

const dummyTalents: Talent[] = [
  { id: 'dummy-t1', full_name: 'Rani Saraswati', bio: 'Senior UX Designer with 6 years at Tokopedia and Gojek. I help designers build portfolios that get hired and teach UX research methods.', avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Bandung, Indonesia', linkedin_url: 'https://linkedin.com/in/ranisaraswati', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t2', full_name: 'Budi Hartono', bio: 'DevOps Engineer & AWS Solutions Architect. 10 years scaling infrastructure for Indonesian unicorns. I mentor on cloud, CI/CD, and SRE practices.', avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Jakarta, Indonesia', linkedin_url: 'https://linkedin.com/in/budihartono', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t3', full_name: 'Siti Rahayu', bio: 'Data Scientist & ML Engineer. PhD in Computer Science from ITB. I help beginners break into data science with practical, project-based learning.', avatar_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Surabaya, Indonesia', linkedin_url: 'https://linkedin.com/in/sitirahayu', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t4', full_name: 'Ahmad Fauzi', bio: 'Senior Mobile Developer (Flutter & React Native). Shipped 20+ apps with 4.5+ star ratings. I coach on mobile architecture and app store optimization.', avatar_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Yogyakarta, Indonesia', linkedin_url: 'https://linkedin.com/in/ahmadfauzi', calendly_url: null, whatsapp: null, _isDummy: true },
  { id: 'dummy-t5', full_name: 'Dewi Lestari', bio: 'Product Manager ex-Ruangguru. I help aspiring PMs master product discovery, user research, and data-driven decision making.', avatar_url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&h=200&w=200', location: 'Jakarta, Indonesia', linkedin_url: 'https://linkedin.com/in/dewilestari', calendly_url: null, whatsapp: null, _isDummy: true },
];

export default function TalentsList() {
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const { fetchTalents } = useTalentsControllers();

  const [filters, setFilters] = useState({
    search: '',
    filter: { location: 'all' },
  });

  const data = useMemo(() => {
    const getMergedTalents = (dbTalents: Talent[]) => {
      const realNames = new Set(dbTalents.map((talent) => talent.full_name?.toLowerCase()));
      return [...dbTalents, ...dummyTalents.filter((dummy) => !realNames.has(dummy.full_name?.toLowerCase()))];
    };

    const getMappedTalent = (talent: Talent) => ({
      id: talent.id,
      name: talent.full_name ?? t('Anonymous', 'Anonim'),
      bio: talent.bio ?? t('IT professional ready to help.', 'Profesional IT siap membantu.'),
      avatarUrl: talent.avatar_url,
      location: talent.location,
      initial: (talent.full_name ?? '?').charAt(0).toUpperCase(),
      linkedinUrl: talent.linkedin_url,
    });

    const getMatchesFilters = (talent: ReturnType<typeof getMappedTalent>) => {
      const query = filters.search.trim().toLowerCase();
      if (query && !talent.name.toLowerCase().includes(query) && !talent.bio.toLowerCase().includes(query)) return false;
      if (filters.filter.location !== 'all' && talent.location !== filters.filter.location) return false;
      return true;
    };

    const all = getMergedTalents(fetchTalents.data ?? []).map(getMappedTalent);
    const list = all.filter(getMatchesFilters);
    const isFiltered = Boolean(filters.search) || filters.filter.location !== 'all';

    return {
      data: list,
      locations: Array.from(new Set(all.map((talent) => talent.location).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)),
      isLoading: fetchTalents.isPending,
      isError: fetchTalents.isError,
      ...signedOutState(!authLoading && !user, t, t('talent', 'talent')),
      isEmpty: !fetchTalents.isPending && !fetchTalents.isError && list.length === 0,
      errorTitle: t('Could not load talent.', 'Gagal memuat talent.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No practitioners match these filters.', 'Tidak ada praktisi yang cocok.')
        : t('No talent profiles yet.', 'Belum ada profil talent.'),
      emptySubtitle: isFiltered
        ? t('Try another city, or a broader search.', 'Coba kota lain, atau kata kunci yang lebih umum.')
        : t('Practitioners open to bookings will appear here.', 'Praktisi yang menerima booking akan muncul di sini.'),
    };
  }, [fetchTalents.data, fetchTalents.isPending, fetchTalents.isError, filters, t, user, authLoading]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'location',
        label: t('Location', 'Lokasi'),
        value: filters.filter.location,
        width: 'sm:w-56',
        options: [
          { value: 'all', label: t('All locations', 'Semua lokasi') },
          ...data.locations.map((location) => ({ value: location, label: location })),
        ],
      },
    ],
    [filters.filter.location, data.locations, t]
  );

  const editTalentsSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const editTalentsFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, filter: { ...prev.filter, [key]: value } }));
  };

  const clearTalentsFilters = () => {
    setFilters({ search: '', filter: { location: 'all' } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Talent', 'Ekosistem · Talent')}
          tone={toneOf('talents')}
          title={t('Talent', 'Talent')}
          subtitle={t(
            'Book 1-on-1 consultations and mentoring with vetted Indonesian IT practitioners.',
            'Pesan konsultasi 1-on-1 dan mentoring dengan praktisi IT Indonesia terverifikasi.'
          )}
        />

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search by name or expertise…', 'Cari nama atau keahlian…')}
          onEditSearch={editTalentsSearch}
          filters={toolbarFilters}
          onEditFilter={editTalentsFilter}
          onClearFilters={clearTalentsFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={0} lines={2} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((talent) => (
                <div key={talent.id} className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      {talent.avatarUrl && <AvatarImage src={talent.avatarUrl} alt="" />}
                      <AvatarFallback className={TONE_CHIP[toneOf('talents')]}>{talent.initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{talent.name}</h3>
                      {talent.location && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {talent.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">{talent.bio}</p>

                  <div className="mt-auto flex gap-2 pt-4">
                    <Link href={`/talents/${talent.id}`} className="flex-1">
                      <Button size="sm" className="w-full">{t('Book a session', 'Pesan sesi')}</Button>
                    </Link>
                    {talent.linkedinUrl && (
                      <a href={talent.linkedinUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">LinkedIn</Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
