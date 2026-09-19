import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

/**
 * Loading placeholders shaped like the card they stand in for, so the grid
 * doesn't reflow when data lands (design standards §13/§22: a skeleton that
 * resembles the real content, never a bare spinner).
 *
 * Pair with `LoadData`'s `customLoader` prop: the caller keeps ownership of
 * what "loading" looks like while `LoadData` still owns empty and error.
 */
export function CardSkeleton({
  media = false,
  lines = 2,
  chips = 2,
  className,
}: Readonly<{ media?: boolean; lines?: number; chips?: number; className?: string }>) {
  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-xl border border-border', className)}>
      {media && <Skeleton className="h-36 w-full rounded-none" />}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>

        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}

        {chips > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {Array.from({ length: chips }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-16 rounded-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** The standard three-up browse grid, filled with `count` placeholders. */
export function CardGridSkeleton({
  count = 6,
  media = false,
  lines = 2,
  chips = 2,
  className,
}: Readonly<{ count?: number; media?: boolean; lines?: number; chips?: number; className?: string }>) {
  return (
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} media={media} lines={lines} chips={chips} />
      ))}
    </div>
  );
}

/** Row-shaped placeholder for list layouts (Discussions, Team Builder). */
export function RowSkeleton({ count = 5 }: Readonly<{ count?: number }>) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-xl border border-border p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="hidden h-5 w-16 shrink-0 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}
