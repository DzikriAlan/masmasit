'use client';

import type * as React from 'react';

import { useLang } from '@/components/language-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  title: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClearConfirm: () => void;
}

/** A delete trigger that asks once before anything irreversible happens. */
export function DeleteConfirmButton({ title, description, disabled, className, children, onClearConfirm }: Props) {
  const { t } = useLang();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" disabled={disabled} className={className}>
          {children}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? t('This cannot be undone.', 'Tindakan ini tidak bisa dibatalkan.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Cancel', 'Batal')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onClearConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('Delete', 'Hapus')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
