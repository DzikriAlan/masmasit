'use client';

import { Download, Users } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { LoadData } from '@/components/load-data';
import { MobileCard, MobileCardList } from '@/components/mobile-card';
import { Pager, usePagination } from '@/components/pager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface EventsAttendeesItem {
  id: string;
  name: string;
  email: string;
  rsvpStatus: string;
  paymentStatus: string;
  paymentLabel: string;
  registeredAt: string;
}

const PAYMENT_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  paid: 'default',
  awaiting_confirmation: 'secondary',
  unpaid: 'outline',
};

/** Organiser-only attendee list with a client-side CSV export. */
export function EventsAttendees({
  attendees,
  isLoading,
  isError,
  isPaidEvent,
  onLoadAttendeesCsv,
}: Readonly<{
  attendees: EventsAttendeesItem[];
  isLoading: boolean;
  isError: boolean;
  isPaidEvent: boolean;
  onLoadAttendeesCsv: () => void;
}>) {
  const { t } = useLang();
  const paged = usePagination(attendees);

  const paymentBadge = (a: EventsAttendeesItem) =>
    isPaidEvent ? (
      <Badge variant={PAYMENT_VARIANT[a.paymentStatus] ?? 'outline'} className="whitespace-nowrap text-xs">
        {a.paymentLabel}
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">{t('Free', 'Gratis')}</Badge>
    );

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Users className="h-5 w-5" /> {t('Attendees', 'Peserta')}
          </CardTitle>
          <CardDescription>
            {attendees.length} {t('registered', 'terdaftar')}
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={onLoadAttendeesCsv} disabled={attendees.length === 0}>
          <Download className="h-4 w-4" /> {t('Export CSV', 'Ekspor CSV')}
        </Button>
      </CardHeader>
      <CardContent>
        <LoadData
          response={{
            isLoading,
            isError,
            isEmpty: !isLoading && !isError && attendees.length === 0,
            emptyTitle: t('No RSVPs yet.', 'Belum ada RSVP.'),
            errorTitle: t('Could not load attendees.', 'Gagal memuat peserta.'),
          }}
        >
          <MobileCardList>
            {paged.items.map((a) => (
              <MobileCard
                key={a.id}
                name={a.name}
                summary={[
                  { label: t('Payment', 'Pembayaran'), value: paymentBadge(a) },
                  { label: t('Registered', 'Terdaftar'), value: a.registeredAt },
                ]}
                details={[
                  { label: t('Name', 'Nama'), value: a.name },
                  { label: 'Email', value: a.email },
                  { label: t('Payment', 'Pembayaran'), value: paymentBadge(a) },
                  { label: t('Registered', 'Terdaftar'), value: a.registeredAt },
                ]}
              />
            ))}
          </MobileCardList>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Name', 'Nama')}</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>{t('Payment', 'Pembayaran')}</TableHead>
                  <TableHead>{t('Registered', 'Terdaftar')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                    <TableCell>{paymentBadge(a)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{a.registeredAt}</TableCell>
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
