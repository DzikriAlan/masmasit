'use client';

import { useLang } from '@/components/language-provider';
import { cn } from '@/shared/lib/utils';

export interface ChipOption {
  value: string;
  en: string;
  id: string;
}

interface Props {
  options: ChipOption[];
  selected: string[];
  onPick: (value: string) => void;
}

/** Pill buttons for single- or multi-select answers; the caller decides which. */
export function ChipGroup({ options, selected, onPick }: Props) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onPick(o.value)}
            aria-pressed={active}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border/70 text-foreground hover:border-foreground/50'
            )}
          >
            {t(o.en, o.id)}
          </button>
        );
      })}
    </div>
  );
}
