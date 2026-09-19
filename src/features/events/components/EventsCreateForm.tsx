'use client';

import { Loader2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export interface EventsFormValues {
  title: string;
  description: string;
  event_type: string;
  location: string;
  event_date: string;
  max_capacity: string;
  is_paid: boolean;
  price: string;
  region_id: string;
}

const EVENT_TYPES = ['meetup', 'workshop', 'hackathon', 'conference'];

/**
 * The host-an-event composer. Split out of EventsList so the browse page
 * isn't carrying a nine-field form, and so every required field can state
 * that it is required in one place.
 */
export function EventsCreateForm({
  values,
  regions,
  saving,
  onEditEvents,
  onSubmitEvents,
  onClearEvents,
}: Readonly<{
  values: EventsFormValues;
  regions: { id: string; name: string }[];
  saving: boolean;
  onEditEvents: (patch: Partial<EventsFormValues>) => void;
  onSubmitEvents: () => void;
  onClearEvents: () => void;
}>) {
  const { t } = useLang();

  const isIncomplete =
    !values.title.trim() ||
    !values.description.trim() ||
    !values.location.trim() ||
    !values.event_date ||
    !values.region_id;

  return (
    <Card className="mb-8 border-dashed">
      <CardHeader>
        <CardTitle className="font-display text-xl">{t('Host an event', 'Adakan event')}</CardTitle>
        <CardDescription>
          {t('A meetup, workshop or hackathon — an admin reviews it before it goes live.', 'Meetup, workshop, atau hackathon — admin meninjau sebelum tayang.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="event-title">{t('Event title', 'Judul event')}</Label>
          <Input
            id="event-title"
            value={values.title}
            onChange={(event) => onEditEvents({ title: event.target.value })}
            placeholder={t('Bandung UX Meetup', 'Bandung UX Meetup')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-description">{t('Description', 'Deskripsi')}</Label>
          <Textarea
            id="event-description"
            value={values.description}
            onChange={(event) => onEditEvents({ description: event.target.value })}
            placeholder={t('What is this event about?', 'Tentang apa event ini?')}
            className="min-h-[100px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="event-type">{t('Event type', 'Tipe event')}</Label>
            <Select value={values.event_type} onValueChange={(value) => onEditEvents({ event_type: value })}>
              <SelectTrigger id="event-type" className="capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-region">{t('Region', 'Wilayah')}</Label>
            <Select value={values.region_id} onValueChange={(value) => onEditEvents({ region_id: value })}>
              <SelectTrigger id="event-region">
                <SelectValue placeholder={t('Select region…', 'Pilih wilayah…')} />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="event-location">{t('Location', 'Lokasi')}</Label>
            <Input
              id="event-location"
              value={values.location}
              onChange={(event) => onEditEvents({ location: event.target.value })}
              placeholder={t('Venue name, city', 'Nama tempat, kota')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-date">{t('Date & time', 'Tanggal & waktu')}</Label>
            <Input
              id="event-date"
              type="datetime-local"
              value={values.event_date}
              onChange={(event) => onEditEvents({ event_date: event.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="event-capacity">{t('Max capacity', 'Kapasitas maks')}</Label>
            <Input
              id="event-capacity"
              type="number"
              min="1"
              inputMode="numeric"
              value={values.max_capacity}
              onChange={(event) => onEditEvents({ max_capacity: event.target.value })}
              placeholder="50"
            />
          </div>
          {values.is_paid && (
            <div className="space-y-2">
              <Label htmlFor="event-price">{t('Price (IDR)', 'Harga (IDR)')}</Label>
              <Input
                id="event-price"
                type="number"
                min="0"
                inputMode="numeric"
                value={values.price}
                onChange={(event) => onEditEvents({ price: event.target.value })}
                placeholder="100000"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="event-paid" className="text-sm font-medium">{t('Paid event', 'Event berbayar')}</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('Attendees pay a fee to register.', 'Peserta membayar biaya untuk mendaftar.')}
            </p>
          </div>
          <Switch
            id="event-paid"
            checked={values.is_paid}
            onCheckedChange={(value) => onEditEvents({ is_paid: value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button onClick={onSubmitEvents} disabled={saving || isIncomplete} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('Create event', 'Buat event')}
          </Button>
          <Button variant="ghost" onClick={onClearEvents}>{t('Cancel', 'Batal')}</Button>
          {isIncomplete && (
            <p className="text-xs text-muted-foreground">
              {t('Title, description, location, date and region are required.', 'Judul, deskripsi, lokasi, tanggal, dan wilayah wajib diisi.')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
