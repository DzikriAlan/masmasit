'use client';

import type * as React from 'react';

import { LoadData } from '@/components/load-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  title: string;
  description?: string;
  isLoading: boolean;
  isError?: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** One titled list card on /activity, with the shared loading / empty states. */
export function ActivityPanel({ title, description, isLoading, isError, isEmpty, emptyTitle, action, children }: Props) {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <LoadData hideIcon response={{ isLoading, isError, isEmpty, emptyTitle }}>
          {children}
        </LoadData>
      </CardContent>
    </Card>
  );
}

interface RowProps {
  children: React.ReactNode;
}

export function ActivityRow({ children }: RowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4">{children}</div>
  );
}
