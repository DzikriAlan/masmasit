'use client';

import { Award, Users } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { LoadData } from '@/components/load-data';
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

  const paymentLabels: Record<string, string> = {
    paid: t('Paid', 'Lunas'),
    awaiting_confirmation: t('Awaiting confirmation', 'Menunggu konfirmasi'),
    unpaid: t('Unpaid', 'Belum bayar'),
  };

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
          <div className="overflow-x-auto">
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
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{p.enrolledAt}</TableCell>
                    <TableCell>
                      {isFree ? (
                        <Badge variant="secondary" className="text-xs">{t('Free', 'Gratis')}</Badge>
                      ) : (
                        <Badge variant={PAYMENT_VARIANT[p.paymentStatus] ?? 'outline'} className="whitespace-nowrap text-xs">
                          {paymentLabels[p.paymentStatus] ?? p.paymentStatus}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.certificateIssuedAt ? (
                        <span className="flex items-center gap-1 whitespace-nowrap text-xs text-success">
                          <Award className="h-3.5 w-3.5" /> {p.certificateIssuedAt}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </LoadData>
      </CardContent>
    </Card>
  );
}
