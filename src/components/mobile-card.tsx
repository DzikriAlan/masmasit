'use client';

import { Eye } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Tables on a phone, as Pixel shows them: below `md` each row becomes a card
 * carrying the fields that matter, with every field behind the eye. Pair a
 * `MobileCardList` with the table wrapped in `hidden md:block`, so the table
 * takes over from `md` up.
 */

export interface MobileCardField {
  label: string;
  value: ReactNode;
}

/** A table's rows as cards, below `md` only. */
export function MobileCardList({
  empty,
  children,
}: Readonly<{
  /** Said when there are no rows. */
  empty?: string;
  children: ReactNode[];
}>) {
  return (
    <div data-slot="mobile-card-list" className="space-y-2 md:hidden">
      {children.length === 0
        ? empty && <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">{empty}</p>
        : children}
    </div>
  );
}

/**
 * A table row as a phone shows it. With `onOpen`, the title's button
 * stretches over the whole card, so a tap anywhere does what clicking the
 * row does; the controls sit above that layer.
 */
export function MobileCard({
  name,
  title,
  leading,
  summary,
  details,
  actions,
  onOpen,
}: Readonly<{
  /** Plain text, for the eye's label and the detail's heading. */
  name: string;
  /** What the card shows as its heading; `name` when not given. */
  title?: ReactNode;
  leading?: ReactNode;
  summary: MobileCardField[];
  /** Every field of the row, behind the eye; no eye when not given. */
  details?: MobileCardField[];
  actions?: ReactNode;
  onOpen?: () => void;
}>) {
  const heading = title ?? <span className="line-clamp-2">{name}</span>;
  return (
    <div data-slot="mobile-card" className="relative rounded-lg border bg-card p-3 text-sm">
      <div className="flex items-start gap-2">
        {leading ? <span className="relative z-10 shrink-0">{leading}</span> : null}
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 flex-1 text-left font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {heading}
          </button>
        ) : (
          <div className="min-w-0 flex-1 font-medium">{heading}</div>
        )}
        {details || actions ? (
          <div className="relative z-10 -my-1 flex shrink-0 items-center">
            {details ? <MobileDetails name={name} details={details} /> : null}
            {actions}
          </div>
        ) : null}
      </div>
      {summary.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
          {summary.map((field) => (
            <div key={field.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{field.label}</dt>
              <dd className="mt-0.5 min-w-0 break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** The eye, and every field of the row in a dialog behind it. */
export function MobileDetails({ name, details }: Readonly<{ name: string; details: MobileCardField[] }>) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t(`View details of ${name}`, `Lihat detail ${name}`)}
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words pr-6">{name}</DialogTitle>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            {details.map((field) => (
              <div key={field.label}>
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="mt-0.5 break-words">{field.value}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
