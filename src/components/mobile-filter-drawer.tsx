'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

/**
 * Search stays inline everywhere; the row of Selects beside it collapses
 * into this bottom sheet below `sm` so filters don't eat the phone's whole
 * first screen. Callers render the same filter controls twice — once in a
 * `hidden sm:grid` row for desktop, once as children here — rather than this
 * component trying to relayout arbitrary filter markup itself.
 */
export function MobileFilterDrawer({
  triggerLabel,
  title,
  applyLabel,
  activeCount = 0,
  children,
}: Readonly<{
  triggerLabel: string;
  title: string;
  applyLabel: string;
  activeCount?: number;
  children: ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline" className="w-full gap-2 sm:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          {triggerLabel}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerClose asChild>
            <button type="button" aria-label="Close" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">{children}</div>
        <DrawerFooter className="border-t border-border">
          <Button onClick={() => setOpen(false)} className="w-full">
            {applyLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function MobileFilterField({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className={cn('space-y-2')}>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {children}
    </div>
  );
}
