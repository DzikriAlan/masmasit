'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Search } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { useAdminApplicationsControllers } from '@/features/admin/controllers/adminControllers';
import AdminPager from '@/features/admin/components/AdminPager';

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  reviewing: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};

interface Props {
  enabled: boolean;
}

/** Every job application on the platform (TC-00-11). */
export default function AdminApplications({ enabled }: Props) {
  const { t } = useLang();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { fetchAdminApplications } = useAdminApplicationsControllers({ search, page, limit: PAGE_SIZE }, enabled);

  const rows = fetchAdminApplications.data?.items ?? [];
  const pagination = fetchAdminApplications.data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };

  const STATUS_LABEL: Record<string, string> = {
    pending: t('Pending', 'Menunggu'),
    reviewing: t('Reviewing', 'Ditinjau'),
    accepted: t('Accepted', 'Diterima'),
    rejected: t('Rejected', 'Ditolak'),
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> {t('Job Applications', 'Lamaran Kerja')}</CardTitle>
        <CardDescription>{t('Every application across all job listings.', 'Semua lamaran di seluruh lowongan.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('Search applicant or job title…', 'Cari pelamar atau judul lowongan…')}
            className="pl-9"
          />
        </div>

        {fetchAdminApplications.isPending ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : fetchAdminApplications.isError ? (
          <p className="text-sm text-destructive">{fetchAdminApplications.error.message}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No applications found.', 'Tidak ada lamaran.')}</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <Link href={`/directory/${row.applicant_id}`} className="font-medium hover:underline">
                    {row.applicant_name ?? row.applicant_email ?? t('Unknown applicant', 'Pelamar tidak diketahui')}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    <Link href={`/jobs/${row.job_id}`} className="hover:underline">{row.job_title ?? t('Deleted job', 'Lowongan dihapus')}</Link>
                    {row.company_name ? ` · ${row.company_name}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString('id-ID')}</span>
                  <Badge variant={STATUS_VARIANT[row.status] ?? 'outline'}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
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
