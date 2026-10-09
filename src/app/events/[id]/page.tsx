import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

import EventsDetail from '@/features/events/components/EventsDetail';

// Metadata is fetched as anon: 028 lets anon read approved events, so only
// public events get a real title/description in link previews.
const getEventMeta = async (id: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await client
    .from('events')
    .select('title, description, location, event_date, status')
    .eq('id', id)
    .maybeSingle();
  return data;
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await getEventMeta(params.id).catch(() => null);
  if (!event) return { title: 'Event — MasmasIT' };

  const when = new Date(event.event_date).toLocaleDateString('id-ID', { dateStyle: 'medium' });
  const prefix = event.status === 'cancelled' ? '[Cancelled] ' : '';
  const title = `${prefix}${event.title} — MasmasIT Events`;
  const description = `${when} · ${event.location}. ${String(event.description ?? '').slice(0, 140)}`;

  return {
    title,
    description,
    alternates: { canonical: `https://masmasit.online/events/${params.id}` },
    openGraph: { title, description, type: 'website', url: `https://masmasit.online/events/${params.id}` },
  };
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return <EventsDetail eventId={params.id} />;
}
