'use client';

import { useEffect, useState } from 'react';
import { Flag, Loader2, Search, Star, Trash2, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { AdminModerationType, DataAdminModeration } from '@/features/admin/types/adminTypes';
import { useAdminModerationControllers } from '@/features/admin/controllers/adminControllers';
import AdminPager from '@/features/admin/components/AdminPager';

const PAGE_SIZE = 20;

interface Props {
  enabled: boolean;
}

/**
 * Moderation (TC-14-06): every content type the community can post, one type
 * at a time, searched and paged on the server and scoped to the admin's
 * region. Discussions carry the Featured toggle (TC-09-04); Spotlight entries
 * can be taken down without deleting the build (TC-09-13).
 */
export default function AdminModeration({ enabled }: Props) {
  const { t } = useLang();
  const [type, setType] = useState<AdminModerationType>('jobs');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const TYPES: { value: AdminModerationType; label: string }[] = [
    { value: 'jobs', label: t('Jobs', 'Lowongan') },
    { value: 'projects', label: t('Projects', 'Proyek') },
    { value: 'courses', label: t('Courses', 'Kursus') },
    { value: 'events', label: t('Events', 'Event') },
    { value: 'discussions', label: t('Discussions', 'Diskusi') },
    { value: 'replies', label: t('Replies', 'Balasan') },
    { value: 'builds', label: t('Builds', 'Builds') },
    { value: 'spotlight', label: t('Spotlight', 'Spotlight') },
  ];

  // Debounced so each keystroke does not hit the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { fetchAdminModeration, removeAdminModeration, changeAdminModeration } = useAdminModerationControllers(
    { type, search, page, limit: PAGE_SIZE },
    enabled
  );

  const items = fetchAdminModeration.data?.items ?? [];
  const pagination = fetchAdminModeration.data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
  const busy = removeAdminModeration.isPending || changeAdminModeration.isPending;

  const loadType = (value: AdminModerationType) => {
    setType(value);
    setPage(1);
  };

  const destroyItem = async (item: DataAdminModeration) => {
    if (!window.confirm(t('Delete this permanently?', 'Hapus permanen?'))) return;
    try {
      await removeAdminModeration.mutateAsync({ type: item.type, id: item.id });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to delete', 'Gagal menghapus'));
      return;
    }
    toast.success(t('Content deleted', 'Konten dihapus'));
  };

  const editFeatured = async (item: DataAdminModeration) => {
    const next = !item.is_featured;
    try {
      await changeAdminModeration.mutateAsync({ type: item.type, id: item.id, data: { is_featured: next } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to update', 'Gagal memperbarui'));
      return;
    }
    toast.success(next ? t('Marked as Featured', 'Ditandai Featured') : t('Removed from Featured', 'Dilepas dari Featured'));
  };

  const editSpotlight = async (item: DataAdminModeration) => {
    try {
      await changeAdminModeration.mutateAsync({ type: item.type, id: item.id, data: { promoted_to_spotlight: false } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to take down', 'Gagal menurunkan'));
      return;
    }
    toast.success(t('Taken down from Spotlight', 'Diturunkan dari Spotlight'));
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5" /> {t('Content Moderation', 'Moderasi Konten')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('Review and remove content that violates community guidelines.', 'Tinjau dan hapus konten yang melanggar pedoman komunitas.')}
        </p>

        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {TYPES.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={type === item.value ? 'default' : 'outline'}
              onClick={() => loadType(item.value)}
              className="shrink-0"
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={type === 'replies' ? t('Search reply text…', 'Cari isi balasan…') : t('Search by title…', 'Cari berdasarkan judul…')}
            className="pl-9"
          />
        </div>

        {fetchAdminModeration.isPending ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : fetchAdminModeration.isError ? (
          <p className="text-sm text-destructive">{fetchAdminModeration.error.message}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No content to moderate.', 'Tidak ada konten untuk dimoderasi.')}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="line-clamp-2 break-words text-sm font-medium">{item.title}</p>
                    {item.is_featured && <Badge className="gap-1 text-xs"><Star className="h-3 w-3" /> {t('Featured', 'Featured')}</Badge>}
                    {item.type === 'builds' && item.promoted_to_spotlight && <Badge variant="secondary" className="text-xs">Spotlight</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[item.author, item.context, new Date(item.created_at).toLocaleDateString('id-ID')].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.type === 'discussions' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => editFeatured(item)} className="gap-1">
                      <Star className="h-3.5 w-3.5" /> {item.is_featured ? t('Unfeature', 'Lepas Featured') : t('Feature', 'Jadikan Featured')}
                    </Button>
                  )}
                  {(item.type === 'spotlight' || (item.type === 'builds' && item.promoted_to_spotlight)) && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => editSpotlight(item)} className="gap-1">
                      <ArrowDownCircle className="h-3.5 w-3.5" /> {t('Take down', 'Turunkan')}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy} className="gap-1 text-destructive hover:text-destructive" onClick={() => destroyItem(item)}>
                    <Trash2 className="h-3.5 w-3.5" /> {t('Delete', 'Hapus')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AdminPager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}
