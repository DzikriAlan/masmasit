'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Loader2, CheckCircle2, Clock, Search, Sparkles, ArrowRight, CreditCard, Plus } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PaymentCard } from '@/components/payment-card';

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  event_date: string;
  max_capacity: number;
  is_paid: boolean;
  price: number | null;
  regions: { name: string } | null;
  event_rsvps?: { id: string; user_id: string }[];
}

const eventImages: Record<string, string> = {
  meetup: 'https://images.pexels.com/photos/7652188/pexels-photo-7652188.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  workshop: 'https://images.pexels.com/photos/9301872/pexels-photo-9301872.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  hackathon: 'https://images.pexels.com/photos/17724731/pexels-photo-17724731.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  conference: 'https://images.pexels.com/photos/8761524/pexels-photo-8761524.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
  default: 'https://images.pexels.com/photos/7643736/pexels-photo-7643736.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
};

const getEventImage = (type: string) => eventImages[type] || eventImages.default;

const eventTypeConfig: Record<string, { color: string; icon: typeof Calendar }> = {
  meetup: { color: 'text-emerald-400', icon: Users },
  workshop: { color: 'text-amber-400', icon: Sparkles },
  hackathon: { color: 'text-blue-400', icon: Calendar },
  conference: { color: 'text-rose-400', icon: Calendar },
};

export default function EventsPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [rsvpIds, setRsvpIds] = useState<Set<string>>(new Set());
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [paidRsvp, setPaidRsvp] = useState<{ rsvpId: string; eventId: string; amount: number; paymentStatus: string } | null>(null);
  const [lynkidEventsUrl, setLynkidEventsUrl] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_type: 'meetup', location: '', event_date: '', max_capacity: '50', is_paid: false, price: '0', region_id: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: regs } = await supabase.from('regions').select('id, name').order('name');
      setRegions((regs as { id: string; name: string }[]) ?? []);
      const { data: settings } = await supabase.from('app_settings').select('lynkid_events_url').maybeSingle();
      if (settings) setLynkidEventsUrl(settings.lynkid_events_url);
      await loadEvents();
    })();
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*, regions(name), event_rsvps(id, user_id)')
      .order('event_date', { ascending: true });
    setEvents((data as EventItem[]) ?? []);

    if (user) {
      const ids = new Set<string>();
      (data as EventItem[])?.forEach((e) => {
        if (e.event_rsvps?.some((r) => r.user_id === user.id)) ids.add(e.id);
      });
      setRsvpIds(ids);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadEvents, 300);
    return () => clearTimeout(timeout);
  }, [regionFilter, typeFilter]);

  const handleCreateEvent = async () => {
    if (!user) { toast.error(t('Please sign in to create an event', 'Silakan masuk untuk membuat event')); return; }
    if (!eventForm.title || !eventForm.description || !eventForm.location || !eventForm.event_date || !eventForm.region_id) {
      toast.error(t('Please fill all required fields', 'Mohon isi semua field wajib'));
      return;
    }
    setSavingEvent(true);
    const payload: Record<string, any> = {
      title: eventForm.title,
      description: eventForm.description,
      event_type: eventForm.event_type,
      location: eventForm.location,
      event_date: new Date(eventForm.event_date).toISOString(),
      max_capacity: parseInt(eventForm.max_capacity) || 50,
      is_paid: eventForm.is_paid,
      price: eventForm.is_paid ? (parseInt(eventForm.price) || 0) : null,
      region_id: eventForm.region_id,
    };
    const { error } = await supabase.from('events').insert(payload);
    setSavingEvent(false);
    if (error) { toast.error(t('Failed to create event', 'Gagal membuat event')); return; }
    toast.success(t('Event created!', 'Event dibuat!'));
    setShowCreate(false);
    setEventForm({ title: '', description: '', event_type: 'meetup', location: '', event_date: '', max_capacity: '50', is_paid: false, price: '0', region_id: '' });
    loadEvents();
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) { toast.error(t('Please sign in to RSVP', 'Silakan masuk untuk RSVP')); return; }
    setRsvpLoading(eventId);
    const { data, error } = await supabase.from('event_rsvps').insert({
      event_id: eventId,
      user_id: user.id,
    }).select('id').single();
    setRsvpLoading(null);
    if (error) {
      if (error.message.includes('duplicate')) toast.error(t('Already registered', 'Sudah terdaftar'));
      else toast.error(t('Failed to RSVP', 'Gagal RSVP'));
      return;
    }
    toast.success(t('RSVP confirmed! See you there.', 'RSVP dikonfirmasi! Sampai jumpa.'));
    const newSet = new Set(rsvpIds);
    newSet.add(eventId);
    setRsvpIds(newSet);
    const event = events.find((e) => e.id === eventId);
    if (event && event.is_paid && event.price && data) {
      setPaidRsvp({ rsvpId: data.id, eventId, amount: event.price, paymentStatus: 'unpaid' });
    }
    loadEvents();
  };

  const filtered = events.filter((e) => {
    if (regionFilter !== 'all' && e.regions?.name !== regionFilter) return false;
    if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const upcoming = filtered.filter((e) => new Date(e.event_date) > new Date());
  const past = filtered.filter((e) => new Date(e.event_date) <= new Date());

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero header */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            {t('Community Events', 'Event Komunitas')}
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{t('Regional Events', 'Event Daerah')}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{t('Join meetups, workshops, and hackathons near you. Connect with people who share your passion.', 'Ikuti meetup, workshop, dan hackathon di dekat Anda. Terhubung dengan orang yang memiliki passion yang sama.')}</p>
        </div>

        <div className="mb-6 flex justify-end">
          <Button onClick={() => user ? setShowCreate(!showCreate) : toast.error(t('Please sign in to create an event', 'Silakan masuk untuk membuat event'))} className="gap-2">
            <Plus className="h-4 w-4" /> {t('Create Event', 'Buat Event')}
          </Button>
        </div>

        {showCreate && (
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="font-display">{t('Create a New Event', 'Buat Event Baru')}</CardTitle>
              <CardDescription>{t('Host a meetup, workshop, or hackathon for the community.', 'Adakan meetup, workshop, atau hackathon untuk komunitas.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="etitle">{t('Event Title', 'Judul Event')}</Label><Input id="etitle" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder={t('Bandung UX Meetup', 'Bandung UX Meetup')} /></div>
              <div className="space-y-2"><Label htmlFor="edesc">{t('Description', 'Deskripsi')}</Label><Textarea id="edesc" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder={t('What is this event about?', 'Tentang apa event ini?')} className="min-h-[100px]" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('Event Type', 'Tipe Event')}</Label>
                  <Select value={eventForm.event_type} onValueChange={(v) => setEventForm({ ...eventForm, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('Region', 'Wilayah')}</Label>
                  <Select value={eventForm.region_id} onValueChange={(v) => setEventForm({ ...eventForm, region_id: v })}>
                    <SelectTrigger><SelectValue placeholder={t('Select region...', 'Pilih wilayah...')} /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="eloc">{t('Location', 'Lokasi')}</Label><Input id="eloc" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder={t('Venue name, city', 'Nama tempat, kota')} /></div>
                <div className="space-y-2"><Label htmlFor="edate">{t('Date & Time', 'Tanggal & Waktu')}</Label><Input id="edate" type="datetime-local" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="ecap">{t('Max Capacity', 'Kapasitas Maks')}</Label><Input id="ecap" type="number" min="1" value={eventForm.max_capacity} onChange={(e) => setEventForm({ ...eventForm, max_capacity: e.target.value })} placeholder="50" /></div>
                {eventForm.is_paid && <div className="space-y-2"><Label htmlFor="eprice">{t('Price (IDR)', 'Harga (IDR)')}</Label><Input id="eprice" type="number" min="0" value={eventForm.price} onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })} placeholder="100000" /></div>}
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <span className="text-sm font-medium">{t('Paid Event', 'Event Berbayar')}</span>
                  <p className="text-xs text-muted-foreground">{t('Charge a fee for attendance', 'Bayar biaya untuk kehadiran')}</p>
                </div>
                <Switch checked={eventForm.is_paid} onCheckedChange={(v) => setEventForm({ ...eventForm, is_paid: v })} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>{t('Cancel', 'Batal')}</Button>
                <Button onClick={handleCreateEvent} disabled={savingEvent || !eventForm.title || !eventForm.description || !eventForm.location || !eventForm.event_date || !eventForm.region_id} className="gap-2">
                  {savingEvent && <Loader2 className="h-4 w-4 animate-spin" />} {t('Create Event', 'Buat Event')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Featured event banner */}
        {upcoming.length > 0 && !loading && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-border/40">
            <div className="relative h-[200px] sm:h-[260px]">
              <img src={getEventImage(upcoming[0].event_type)} alt={upcoming[0].title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <Sparkles className="h-3 w-3" /> {t('Featured', 'Unggulan')}
                  </Badge>
                  <Badge variant="secondary" className="capitalize text-xs">{upcoming[0].event_type}</Badge>
                  {upcoming[0].regions && <Badge variant="outline" className="text-xs">{upcoming[0].regions.name}</Badge>}
                </div>
                <h2 className="font-display text-xl font-bold sm:text-2xl">{upcoming[0].title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> {new Date(upcoming[0].event_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {upcoming[0].location}</span>
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> {upcoming[0].event_rsvps?.length ?? 0}/{upcoming[0].max_capacity}</span>
                </div>
                <div className="mt-3">
                  {rsvpIds.has(upcoming[0].id) ? (
                    <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> {t('Registered', 'Terdaftar')}</Badge>
                  ) : (
                    <Button size="sm" className="gap-2 glow-primary" onClick={() => handleRSVP(upcoming[0].id)} disabled={rsvpLoading === upcoming[0].id}>
                      {rsvpLoading === upcoming[0].id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Users className="h-4 w-4" /> {t('RSVP Now', 'RSVP Sekarang')}</>}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search events...', 'Cari event...')}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('All Types', 'Semua Tipe')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Types', 'Semua Tipe')}</SelectItem>
              <SelectItem value="meetup">Meetup</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="hackathon">Hackathon</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('All Regions', 'Semua Wilayah')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Regions', 'Semua Wilayah')}</SelectItem>
              {regions.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Events grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">{t('No events found. Try adjusting your filters.', 'Tidak ada event ditemukan. Coba ubah filter.')}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary" />
                  {t('Upcoming', 'Mendatang')} ({upcoming.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.slice(1).map((e, i) => {
                    const spotsLeft = e.max_capacity - (e.event_rsvps?.length ?? 0);
                    const isRSVPed = rsvpIds.has(e.id);
                    const typeCfg = eventTypeConfig[e.event_type] ?? eventTypeConfig.conference;
                    const fillPct = Math.round(((e.event_rsvps?.length ?? 0) / e.max_capacity) * 100);
                    return (
                      <Card key={e.id} className="group glass glass-hover overflow-hidden stagger-1" style={{ animationDelay: `${i * 0.06}s` }}>
                        <div className="relative h-32 overflow-hidden">
                          <img src={getEventImage(e.event_type)} alt={e.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge variant="secondary" className="capitalize text-xs backdrop-blur-md">{e.event_type}</Badge>
                            {e.is_paid && <Badge variant="default" className="text-xs backdrop-blur-md">{t('Paid', 'Berbayar')}</Badge>}
                          </div>
                          {e.regions && <Badge variant="outline" className="absolute bottom-3 left-3 text-xs backdrop-blur-md">{e.regions.name}</Badge>}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold leading-tight">{e.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                            <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary/70" /> {new Date(e.event_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary/70" /> {e.location}</p>
                          </div>
                          {/* Capacity bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{spotsLeft} {t('spots left', 'slot tersisa')}</span>
                              <span className={`font-medium ${fillPct > 80 ? 'text-warning' : 'text-primary'}`}>{fillPct}%</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${fillPct > 80 ? 'bg-warning' : 'bg-primary'}`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            {isRSVPed ? (
                              <div className="flex items-center gap-2 text-success text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4" /> {t('Registered', 'Terdaftar')}
                              </div>
                            ) : spotsLeft > 0 ? (
                              <Button size="sm" className="w-full gap-2" onClick={() => handleRSVP(e.id)} disabled={rsvpLoading === e.id}>
                                {rsvpLoading === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Users className="h-3.5 w-3.5" /> {t('RSVP Now', 'RSVP Sekarang')}</>}
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled className="w-full">{t('Sold Out', 'Penuh')}</Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <h2 className="mb-4 mt-10 font-display text-lg font-semibold text-muted-foreground">{t('Past Events', 'Event Sebelumnya')} ({past.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {past.slice(0, 6).map((e) => (
                    <Card key={e.id} className="glass opacity-70">
                      <div className="relative h-24 overflow-hidden rounded-t-lg">
                        <img src={getEventImage(e.event_type)} alt={e.title} className="h-full w-full object-cover grayscale" />
                        <div className="absolute inset-0 bg-background/50" />
                        <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs backdrop-blur-md">{t('Ended', 'Selesai')}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold">{e.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {e.location}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {e.event_rsvps?.length ?? 0} {t('attended', 'hadir')}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* CTA */}
        {!user && !loading && (
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
            <h3 className="font-display text-lg font-bold">{t('Want to host an event?', 'Ingin mengadakan event?')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('Join the community and start organizing meetups in your region.', 'Gabung komunitas dan mulai mengorganisir meetup di daerah Anda.')}</p>
            <Link href="/register"><Button className="mt-4 gap-2">{t('Join Now', 'Gabung Sekarang')} <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        )}

        {/* Paid event payment modal */}
        {paidRsvp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPaidRsvp(null)}>
            <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <PaymentCard
                table="event_rsvps"
                recordId={paidRsvp.rsvpId}
                itemName={t('Event Registration', 'Pendaftaran Event')}
                amount={paidRsvp.amount}
                paymentStatus={paidRsvp.paymentStatus}
                paymentLinkUrl={null}
                paymentNote={null}
                fallbackUrl={lynkidEventsUrl}
                onStatusChange={(s) => setPaidRsvp({ ...paidRsvp, paymentStatus: s })}
              />
              <Button variant="outline" className="mt-3 w-full" onClick={() => setPaidRsvp(null)}>{t('Close', 'Tutup')}</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
