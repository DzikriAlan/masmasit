'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Star, MapPin, CalendarClock, Link as LinkIcon, MessageCircle, CreditCard, CheckCircle2, Send } from 'lucide-react';
import { PaymentCard } from '@/components/payment-card';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TalentProfile {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  linkedin_url: string | null;
  whatsapp: string | null;
  calendly_url: string | null;
}

export default function TalentBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ booking_type: 'consultation', scheduled_at: '', notes: '', amount: '500000', external_name: '', external_email: '' });
  const [saving, setSaving] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [lynkidUrl, setLynkidUrl] = useState<string | null>(null);
  const [adminFee, setAdminFee] = useState(15);

  useEffect(() => {
    (async () => {
      const id = params.id as string;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setTalent(data as TalentProfile | null);

      const { data: settings } = await supabase.from('app_settings').select('talent_admin_fee_percentage, lynkid_bookings_url').maybeSingle();
      if (settings) {
        setAdminFee(Number(settings.talent_admin_fee_percentage));
        setLynkidUrl(settings.lynkid_bookings_url);
      }
      setLoading(false);
    })();
  }, [params]);

  const handleBooking = async () => {
    if (!talent) return;
    setSaving(true);

    const amount = parseInt(booking.amount);
    const insertData: Record<string, unknown> = {
      talent_id: talent.id,
      booking_type: booking.booking_type,
      scheduled_at: booking.scheduled_at,
      notes: booking.notes || null,
      amount,
      admin_fee_percentage: adminFee,
      status: 'pending',
    };
    if (user) {
      insertData.client_id = user.id;
    } else {
      insertData.client_id = null;
      insertData.client_name = booking.external_name;
      insertData.client_email = booking.external_email;
    }
    const { data, error } = await supabase.from('bookings').insert(insertData).select('id').single();
    setSaving(false);
    if (error) { toast.error(t('Failed to create booking', 'Gagal membuat booking')); return; }
    setBookingId(data.id);
    toast.success(t('Booking created! Complete payment below.', 'Booking dibuat! Selesaikan pembayaran di bawah.'));
    setBooked(true);
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  if (!talent) return <AppShell><div className="py-20 text-center text-muted-foreground">{t('Talent not found.', 'Talent tidak ditemukan.')}</div></AppShell>;

  const netAmount = parseInt(booking.amount || '0') * (1 - adminFee / 100);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> {t('Back', 'Kembali')}</Button>

        {/* Talent info */}
        <Card className="glass mb-6 transition-all hover:border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-xl font-bold">
                {talent.avatar_url ? <img src={talent.avatar_url} alt={talent.full_name ?? ''} className="h-16 w-16 rounded-2xl object-cover" /> : talent.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold">{talent.full_name ?? 'Anonymous'}</h1>
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

        {/* Booking form */}
        {booked && bookingId ? (
          <div className="space-y-4">
            <Card className="glass">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
                <h2 className="font-display text-xl font-bold">{t('Booking Created!', 'Booking Dibuat!')}</h2>
                <p className="mt-2 text-muted-foreground">{t('Your booking request has been sent. Complete payment to confirm.', 'Permintaan booking Anda telah dikirim. Selesaikan pembayaran untuk konfirmasi.')}</p>
                <div className="mt-4 rounded-lg border border-border/60 p-4 text-left">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Session Amount', 'Jumlah Sesi')}</span><span className="font-medium">Rp {parseInt(booking.amount).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Admin Fee', 'Biaya Admin')} ({adminFee}%)</span><span className="text-destructive">- Rp {(parseInt(booking.amount) - Math.round(netAmount)).toLocaleString('id-ID')}</span></div>
                  <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-sm"><span className="font-medium">{t('Talent Receives', 'Talent Menerima')}</span><span className="font-bold text-success">Rp {Math.round(netAmount).toLocaleString('id-ID')}</span></div>
                </div>
              </CardContent>
            </Card>
            <PaymentCard
              table="bookings"
              recordId={bookingId}
              itemName={t('Talent Booking', 'Booking Talent')}
              amount={parseInt(booking.amount)}
              paymentStatus={paymentStatus}
              paymentLinkUrl={null}
              paymentNote={null}
              fallbackUrl={lynkidUrl}
              onStatusChange={setPaymentStatus}
            />
            <Link href="/dashboard"><Button className="w-full">{t('Back to Dashboard', 'Kembali ke Dashboard')}</Button></Link>
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
                  <p className="text-sm text-muted-foreground">{t('Booking as a guest. Sign in to save your booking history, or continue below.', 'Booking sebagai tamu. Masuk untuk menyimpan riwayat booking, atau lanjutkan di bawah.')}</p>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t('Amount (IDR)', 'Jumlah (IDR)')}</Label>
                <Input id="amount" type="number" value={booking.amount} onChange={(e) => setBooking({ ...booking, amount: e.target.value })} placeholder="500000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('Notes (optional)', 'Catatan (opsional)')}</Label>
                <Textarea id="notes" value={booking.notes} onChange={(e) => setBooking({ ...booking, notes: e.target.value })} placeholder={t('What would you like to discuss?', 'Apa yang ingin Anda diskusikan?')} />
              </div>

              {/* Fee breakdown */}
              <div className="rounded-lg border border-border/60 p-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Session Amount', 'Jumlah Sesi')}</span><span>Rp {parseInt(booking.amount || '0').toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Admin Fee', 'Biaya Admin')} ({adminFee}%)</span><span className="text-destructive">- Rp {(parseInt(booking.amount || '0') - Math.round(netAmount)).toLocaleString('id-ID')}</span></div>
                <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-sm font-medium"><span>{t('Talent Receives', 'Talent Menerima')}</span><span className="text-success">Rp {Math.round(netAmount).toLocaleString('id-ID')}</span></div>
              </div>

              <Button
                onClick={handleBooking}
                disabled={saving || !booking.scheduled_at || !booking.amount || (!user && (!booking.external_name || !booking.external_email))}
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
