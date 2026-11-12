'use client';

import React from 'react';

export function LessonReaderLoadingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-lh-surface-2" />
        <div className="aspect-[2.2/1] animate-pulse rounded-2xl bg-lh-surface-2" />
        <div className="h-40 animate-pulse rounded-2xl bg-lh-surface-2" />
      </div>
      <div className="hidden h-96 animate-pulse rounded-2xl bg-lh-surface-2 lg:block" />
    </div>
  );
}
