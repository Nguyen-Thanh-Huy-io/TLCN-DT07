'use client';

import React from 'react';
import {
  EventLocationScopeStrategy,
  EventLocationKind,
} from '../strategies/location-scope.strategy';

export interface EventLocationCellProps {
  historicalLocation?: {
    name: string;
    address?: string | null;
    type?: string | null;
  } | null;
  metadata?: Record<string, any> | null;
}

export function EventLocationCell({
  historicalLocation,
  metadata,
}: EventLocationCellProps) {
  const result = EventLocationScopeStrategy.resolve({
    historicalLocation,
    metadata,
  });

  const IconComp = result.icon;

  if (result.kind === EventLocationKind.UNSPECIFIED) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-slate-400 italic"
        title={result.tooltip}
      >
        <IconComp size={13} className="shrink-0 text-slate-400" />
        <span>Chưa xác định địa điểm</span>
      </div>
    );
  }

  if (result.kind === EventLocationKind.STRATEGIC_SCOPE) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold"
        title={result.tooltip}
      >
        <IconComp size={13} className="shrink-0 text-blue-600" />
        <span className="truncate max-w-[20ch]">{result.displayName}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-slate-800"
      title={result.tooltip}
    >
      <IconComp size={14} className="shrink-0 text-red-600" />
      <span className="font-medium truncate max-w-[22ch]">
        {result.displayName}
      </span>
    </div>
  );
}
