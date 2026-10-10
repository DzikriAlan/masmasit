'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Star, MapPin, CalendarClock, Link as LinkIcon, MessageCircle, CreditCard, CheckCircle2, Send, ExternalLink, LogIn } from 'lucide-react';
import { toast } from 'sonner';

import type { PayloadPostTalentsBooking } from '@/features/talents/types/talentsTypes';
import { useTalentsBookingControllers } from '@/features/talents/controllers/talentsControllers';
import { PaymentCard } from '@/features/payments/components/PaymentCard';
import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { ShareButton } from '@/components/share-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberReviews } from '@/features/reviews/components/MemberReviews';
import { loginHref } from '@/shared/lib/utils';

export default function TalentBooking() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [booking, setBooking] = useState({ booking_type: 'consultation', scheduled_at: '', notes: '', amount: '', external_name: '', external_email: '' });
  const [booked, setBooked] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');

  const { fetchTalentProfile, fetchBookingSettings, fetchTalentsBookedSlots, storeTalentsBooking } =
    useTalentsBookingControllers(params.id as string, Boolean(user));

  const talent = fetchTalentProfile.data ?? null;
  const loading = fetchTalentProfile.isPending;
  const saving = storeTalentsBooking.isPending;
  const settings = fetchBookingSettings.data ?? null;
  const adminFee = settings ? Number(settings.talent_admin_fee_percentage) : 15;
  const goakalUrl = settings?.goakal_bookings_url ?? null;

  // The talent's own rate seeds the amount; 500k stays the fallback when unset.
  const defaultAmount = String(talent?.hourly_rate ?? 500000);
  const bookingAmount = booking.amount || defaultAmount;
  // One number drives the fee summary, the Confirm button and the payload, so
  // the prefilled session rate counts without being retyped.
  const amountValue = Number.parseInt(bookingAmount, 10) || 0;
  const netAmount = amountValue * (1 - adminFee / 100);
  const adminFeeAmount = amountValue - Math.round(netAmount);
  const isGuestInfoMissing = !user && (!booking.external_name.trim() || !booking.external_email.trim());
  const isConfirmDisabled = saving || !booking.scheduled_at || amountValue <= 0 || isGuestInfoMissing;
  const getSlotLabel = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'id' ? 'id-ID' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const bookedSlots = (fetchTalentsBookedSlots.data ?? []).map((slot) => getSlotLabel(slot.scheduled_at));

  const saveBooking = async () => {
    if (!talent) return;

    const payload: PayloadPostTalentsBooking = {
      talent_id: talent.id,
      booking_type: booking.booking_type,
      // datetime-local has no zone; send the visitor's local time as an instant.
      scheduled_at: new Date(booking.scheduled_at).toISOString(),
      notes: booking.notes || null,
      amount: amountValue,
      admin_fee_percentage: adminFee,
      status: 'pending',
      client_id: user ? user.id : null,
    };
    if (!user) {
      payload.client_name = booking.external_name;
      payload.client_email = booking.external_email;
    }

    let created: { id: string } | null = null;
    try {
      created = await storeTalentsBooking.mutateAsync(payload);
    } catch (error) {
      // Raised by the bookings_no_clash trigger (migration 028).
      const isSlotTaken = error instanceof Error && error.message.includes('BOOKING_SLOT_TAKEN');
      toast.error(
        isSlotTaken
          ? t('This time is already booked. Please choose another slot.', 'Jadwal ini sudah terisi. Silakan pilih waktu lain.')
          : t('Failed to create booking', 'Gagal membuat booking'),
        isSlotTaken && bookedSlots.length
          ? { description: `${t('Booked', 'Terisi')}: ${bookedSlots.join(', ')}` }
          : undefined
      );
      return;
    }
    setBookingId(created.id);
    toast.success(t('Booking created! Complete payment below.', 'Booking dibuat! Selesaikan pembayaran di bawah.'));
    setBooked(true);
  };

  if (loading || !talent) {
    return (
      <AppShell>
        <LoadData
          minHeight="60vh"
          response={{
            isLoading: loading,
            isEmpty: !talent,
            emptyTitle: t('Talent not found.', 'Talent tidak ditemukan.'),
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2"><ArrowLeft className="h-4 w-4" /> {t('Back', 'Kembali')}</Button>
          <ShareButton
            url={`/talents/${talent.id}`}
            title={`${talent.full_name ?? 'Talent'} — MasmasIT`}
            text={t('Book a 1-on-1 session', 'Pesan sesi 1-on-1')}
          />
        </div>

        {/* Talent info */}
        <Card className="glass mb-6 transition-all hover:border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-xl font-bold">
                {talent.avatar_url ? <img src={talent.avatar_url} alt={talent.full_name ?? ''} className="h-16 w-16 rounded-2xl object-cover" /> : talent.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-semibold">{talent.full_name ?? 'Anonymous'}</h1>
                  <Badge variant="default" className="gap-1"><Star className="h-3 w-3 text-amber-400" /> {t('Talent', 'Talent')}</Badge>
                </div>
                {talent.location && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" /> {talent.location}</p>}
                {talent.bio && <p className="mt-2 text-sm text-muted-foreground">{talent.bio}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {talent.linkedin_url && <a href={talent.linkedin_url} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-2"><LinkIcon className="h-3.5 w-3.5" /> LinkedIn</Button></a>}
                  {talent.whatsapp && <a href={`https://wa.me/${talent.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-2"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</Button></a>}
                  {talent.calendly_url && <a href={talent.calendly_url} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-2"><CalendarClock className="h-3.5 w-3.5" /> Calendly</Button></a>}
                  {user && (
                    <Link href={`/pesan?to=${talent.id}`}>
                      <Button variant="outline" size="sm" className="gap-2"><Send className="h-3.5 w-3.5" /> {t('Chat', 'Chat')}</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <MemberReviews userId={talent.id} />
        </div>

        {/* Booking form */}
        {booked && bookingId ? (
          <div className="space-y-4">
            <Card className="glass">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
                <h2 className="font-display text-xl font-semibold">{t('Booking Created!', 'Booking Dibuat!')}</h2>
                <p className="mt-2 text-muted-foreground">{t('Your booking request has been sent. Complete payment to confirm.', 'Permintaan booking Anda telah dikirim. Selesaikan pembayaran untuk konfirmasi.')}</p>
                <div className="mt-4 rounded-lg border border-border/60 p-4 text-left">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Session Amount', 'Jumlah Sesi')}</span><span className="font-medium">Rp {amountValue.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Admin Fee', 'Biaya Admin')} ({adminFee}%)</span><span className="text-destructive">- Rp {adminFeeAmount.toLocaleString('id-ID')}</span></div>
                  <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-sm"><span className="font-medium">{t('Talent Receives', 'Talent Menerima')}</span><span className="font-bold text-success">Rp {Math.round(netAmount).toLocaleString('id-ID')}</span></div>
                </div>
              </CardContent>
            </Card>
            {user ? (
              <>
                <PaymentCard
                  table="bookings"
                  recordId={bookingId}
                  itemName={t('Talent Booking', 'Booking Talent')}
                  amount={amountValue}
                  paymentStatus={paymentStatus}
                  paymentLinkUrl={null}
                  paymentNote={null}
                  fallbackUrl={goakalUrl}
                  onStatusChange={setPaymentStatus}
                />
                <Link href="/dashboard"><Button className="w-full">{t('Back to Dashboard', 'Kembali ke Dashboard')}</Button></Link>
              </>
            ) : (
              <GuestBookingNext email={booking.external_email} payUrl={goakalUrl} />
            )}
          </div>
        ) : (
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary"><CalendarClock className="h-5 w-5" /></div>
              <CardTitle>{t('Book a Session', 'Pesan Sesi')}</CardTitle>
              <CardDescription>{t('Choose a session type and pick a time that works for you.', 'Pilih jenis sesi dan waktu yang sesuai untuk Anda.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">{t('Booking as a guest. Sign in to save your booking history, or continue below.', 'Booking sebagai tamu. Masuk untuk menyimpan riwayat booking, atau lanjutkan di bawah.')}</p>
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => router.push(loginHref())}>
                      <LogIn className="h-3.5 w-3.5" /> {t('Sign in', 'Masuk')}
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="en">{t('Your Name', 'Nama Anda')}</Label>
                      <Input id="en" value={booking.external_name} onChange={(e) => setBooking({ ...booking, external_name: e.target.value })} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ee">{t('Email', 'Email')}</Label>
                      <Input id="ee" type="email" value={booking.external_email} onChange={(e) => setBooking({ ...booking, external_email: e.target.value })} placeholder="john@email.com" />
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t('Session Type', 'Jenis Sesi')}</Label>
                <Select value={booking.booking_type} onValueChange={(v) => setBooking({ ...booking, booking_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">{t('Consultation', 'Konsultasi')}</SelectItem>
                    <SelectItem value="mentoring">{t('Mentoring', 'Mentoring')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">{t('Date & Time', 'Tanggal & Waktu')}</Label>
                <Input id="schedule" type="datetime-local" value={booking.scheduled_at} onChange={(e) => setBooking({ ...booking, scheduled_at: e.target.value })} />
                {bookedSlots.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('Already booked (pick another time):', 'Sudah terisi (pilih waktu lain):')} {bookedSlots.join(', ')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t('Amount (IDR)', 'Jumlah (IDR)')}</Label>
                <Input id="amount" type="number" value={bookingAmount} onChange={(e) => setBooking({ ...booking, amount: e.target.value })} placeholder={defaultAmount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('Notes (optional)', 'Catatan (opsional)')}</Label>
                <Textarea id="notes" value={booking.notes} onChange={(e) => setBooking({ ...booking, notes: e.target.value })} placeholder={t('What would you like to discuss?', 'Apa yang ingin Anda diskusikan?')} />
              </div>

              {/* Fee breakdown */}
              <div className="rounded-lg border border-border/60 p-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Session Amount', 'Jumlah Sesi')}</span><span>Rp {amountValue.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Admin Fee', 'Biaya Admin')} ({adminFee}%)</span><span className="text-destructive">- Rp {adminFeeAmount.toLocaleString('id-ID')}</span></div>
                <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-sm font-medium"><span>{t('Talent Receives', 'Talent Menerima')}</span><span className="text-success">Rp {Math.round(netAmount).toLocaleString('id-ID')}</span></div>
              </div>

              <Button
                onClick={saveBooking}
                disabled={isConfirmDisabled}
                className="w-full gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {t('Confirm Booking', 'Konfirmasi Booking')}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{t(`Admin fee of ${adminFee}% is deducted from the session amount.`, `Biaya admin ${adminFee}% dipotong dari jumlah sesi.`)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

interface GuestBookingNextProps {
  email: string;
  payUrl: string | null;
}

/** Guests cannot report a payment (no account), so they get the link only. */
function GuestBookingNext({ email, payUrl }: GuestBookingNextProps) {
  const { t } = useLang();
  return (
    <Card className="glass border-primary/20">
      <CardContent className="space-y-3 p-5 text-sm">
        <p className="text-muted-foreground">
          {t(
            `We'll follow up at ${email} once the talent confirms your session.`,
            `Kami akan menghubungi ${email} setelah talent mengonfirmasi sesi Anda.`
          )}
        </p>
        {payUrl && (
          <a href={payUrl} target="_blank" rel="noreferrer">
            <Button className="w-full gap-2"><ExternalLink className="h-4 w-4" /> {t('Continue to payment', 'Lanjut ke pembayaran')}</Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
