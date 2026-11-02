'use client';

import { Award, Users } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { LoadData } from '@/components/load-data';
import { MobileCard, MobileCardList } from '@/components/mobile-card';
import { Pager, usePagination } from '@/components/pager';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface CoachParticipantsItem {
  id: string;
  name: string;
  email: string | null;
  enrolledAt: string;
  paymentStatus: string;
  progress: number;
  certificateIssuedAt: string | null;
}

const PAYMENT_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  paid: 'default',
  awaiting_confirmation: 'secondary',
  unpaid: 'outline',
};

/** Who is in one course: enrolled date, payment, progress and certificate. */
export function CoachParticipants({
  participants,
  isLoading,
  isError,
  isFree,
}: Readonly<{
  participants: CoachParticipantsItem[];
  isLoading: boolean;
  isError: boolean;
  isFree: boolean;
}>) {
  const { t } = useLang();
  const paged = usePagination(participants);

  const paymentLabels: Record<string, string> = {
    paid: t('Paid', 'Lunas'),
    awaiting_confirmation: t('Awaiting confirmation', 'Menunggu konfirmasi'),
    unpaid: t('Unpaid', 'Belum bayar'),
  };

  const paymentBadge = (p: CoachParticipantsItem) =>
    isFree ? (
      <Badge variant="secondary" className="text-xs">{t('Free', 'Gratis')}</Badge>
    ) : (
      <Badge variant={PAYMENT_VARIANT[p.paymentStatus] ?? 'outline'} className="whitespace-nowrap text-xs">
        {paymentLabels[p.paymentStatus] ?? p.paymentStatus}
      </Badge>
    );
  const progressBar = (p: CoachParticipantsItem) => (
    <div className="flex items-center gap-2">
      <Progress value={p.progress} className="h-1.5 w-16" />
      <span className="text-xs text-muted-foreground">{p.progress}%</span>
    </div>
  );
  const certificate = (p: CoachParticipantsItem) =>
    p.certificateIssuedAt ? (
      <span className="flex items-center gap-1 whitespace-nowrap text-xs text-success">
        <Award className="h-3.5 w-3.5" /> {p.certificateIssuedAt}
      </span>
    ) : (
      <span className="text-xs text-muted-foreground">—</span>
    );

  return (
    <Card className="glass mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <Users className="h-5 w-5 text-primary" /> {t('Participants', 'Peserta')}
        </CardTitle>
        <CardDescription>
          {participants.length} {t('enrolled', 'terdaftar')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoadData
          response={{
            isLoading,
            isError,
            isEmpty: !isLoading && !isError && participants.length === 0,
            emptyTitle: t('No participants yet.', 'Belum ada peserta.'),
            errorTitle: t('Could not load participants.', 'Gagal memuat peserta.'),
          }}
        >
          <MobileCardList>
            {paged.items.map((p) => (
              <MobileCard
                key={p.id}
                name={p.name}
                title={
                  <>
                    <span className="line-clamp-2">{p.name}</span>
                    {p.email && <span className="block truncate text-xs font-normal text-muted-foreground">{p.email}</span>}
                  </>
                }
                summary={[
                  { label: t('Payment', 'Pembayaran'), value: paymentBadge(p) },
                  { label: t('Progress', 'Progres'), value: progressBar(p) },
                ]}
                details={[
                  { label: t('Name', 'Nama'), value: p.name },
                  ...(p.email ? [{ label: 'Email', value: p.email }] : []),
                  { label: t('Enrolled', 'Tanggal daftar'), value: p.enrolledAt },
                  { label: t('Payment', 'Pembayaran'), value: paymentBadge(p) },
                  { label: t('Progress', 'Progres'), value: progressBar(p) },
                  { label: t('Certificate', 'Sertifikat'), value: certificate(p) },
                ]}
              />
            ))}
          </MobileCardList>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Name', 'Nama')}</TableHead>
                  <TableHead>{t('Enrolled', 'Tanggal daftar')}</TableHead>
                  <TableHead>{t('Payment', 'Pembayaran')}</TableHead>
                  <TableHead className="min-w-[120px]">{t('Progress', 'Progres')}</TableHead>
                  <TableHead>{t('Certificate', 'Sertifikat')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.items.map((p) => (
                  <TableRow key={p.id} className="h-16">
                    <TableCell className="py-2">
                      <div className="w-56" title={p.email ? `${p.name}\n${p.email}` : p.name}>
                        <p className="truncate font-medium">{p.name}</p>
                        {p.email && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-2 text-sm">{p.enrolledAt}</TableCell>
                    <TableCell className="py-2">{paymentBadge(p)}</TableCell>
                    <TableCell className="py-2">{progressBar(p)}</TableCell>
                    <TableCell className="py-2">{certificate(p)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager className="mt-4" {...paged.pager} />
        </LoadData>
      </CardContent>
    </Card>
  );
}
