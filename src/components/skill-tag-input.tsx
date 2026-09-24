'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { cn } from '@/shared/lib/utils';
import type { Skill } from '@/shared/lib/types';

/** A picked skill. `id` is null for a name the member typed that is not in
 *  the catalogue yet; callers resolve those through ensure_skills() on save. */
export interface SkillTag {
  id: string | null;
  name: string;
}

interface Props {
  id?: string;
  options: Skill[];
  value: SkillTag[];
  onChange: (value: SkillTag[]) => void;
  max?: number;
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 40);

/**
 * Tags sit inside the field; typing filters the catalogue and offers
 * "Add …" for anything missing. The list is rendered in-flow under the field
 * (not in a portal) so it always opens downward and scrolls with a dialog.
 */
export function SkillTagInput({ id, options, value, onChange, max = 30 }: Props) {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const picked = useMemo(() => new Set(value.map((v) => v.name.toLowerCase())), [value]);
  const q = clean(query).toLowerCase();

  const matches = useMemo(
    () =>
      options
        .filter((o) => !picked.has(o.name.toLowerCase()) && (!q || o.name.toLowerCase().includes(q)))
        .slice(0, 50),
    [options, picked, q]
  );
  const canCreate =
    !!q && !picked.has(q) && !options.some((o) => o.name.toLowerCase() === q);
  const items: SkillTag[] = [
    ...matches.map((m) => ({ id: m.id, name: m.name })),
    ...(canCreate ? [{ id: null, name: clean(query) }] : []),
  ];
  const full = value.length >= max;

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    if (open) listRef.current?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  const add = (tag: SkillTag) => {
    if (full || picked.has(tag.name.toLowerCase())) return;
    onChange([...value, tag]);
    setQuery('');
  };
  const remove = (name: string) => onChange(value.filter((v) => v.name !== name));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ',') {
      if (!q) return;
      e.preventDefault();
      const item = items[active] ?? items[0];
      if (item) add(item);
    } else if (e.key === 'Backspace' && !query && value.length) {
      remove(value[value.length - 1].name);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      >
        {value.map((v) => (
          <span key={v.name} className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pl-2.5 pr-1.5">
            {v.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(v.name);
              }}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label={t(`Remove ${v.name}`, `Hapus ${v.name}`)}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          ref={inputRef}
          value={query}
          disabled={full}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          placeholder={
            full
              ? t(`Up to ${max} skills`, `Maksimal ${max} skill`)
              : value.length
                ? ''
                : t('Type or pick a skill…', 'Ketik atau pilih skill…')
          }
          className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      {open && !full && items.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          // Keep focus in the input so a click picks instead of blurring.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {items.map((item, i) => (
            <li
              key={item.id ?? `new:${item.name}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => add(item)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                i === active && 'bg-accent text-accent-foreground'
              )}
            >
              {item.id ? (
                item.name
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  {t(`Add "${item.name}"`, `Tambah "${item.name}"`)}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
