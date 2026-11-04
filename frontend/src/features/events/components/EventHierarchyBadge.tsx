'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, GitBranch, CornerDownRight } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';

export interface EventHierarchyBadgeProps {
  parentId?: string | null;
  parent?: {
    id: string;
    title: string;
    slug?: string;
  } | null;
  childrenCount?: number;
  onFilterByParent?: (parentId: string) => void;
}

export function EventHierarchyBadge({
  parentId,
  parent,
  childrenCount = 0,
  onFilterByParent,
}: EventHierarchyBadgeProps) {
  const isSub = Boolean(parentId);
  const isParent = childrenCount > 0;

  if (!isSub && !isParent) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
      {/* 1. Trường hợp là Sự kiện Cha (Chiến dịch / Đại sự kiện có các sự kiện thành phần) */}
      {isParent && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] shadow-2xs"
          title={`Sự kiện quy mô chiến dịch tổng thể bao gồm ${childrenCount} sự kiện/giai đoạn con`}
        >
          <Layers size={12} className="text-indigo-600" />
          <span>Chiến dịch lớn ({childrenCount} sự kiện con)</span>
        </span>
      )}

      {/* 2. Trường hợp là Sự kiện Con (Trực thuộc sự kiện cha cụ thể) */}
      {isSub && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-medium">
          <CornerDownRight size={12} className="text-purple-600 shrink-0" />
          <span className="text-purple-600 font-semibold">Trực thuộc:</span>
          {parent ? (
            <Link
              href={APP_ROUTES.EVENTS.DETAIL(parent.id)}
              className="hover:underline font-bold text-purple-800 line-clamp-1 max-w-[28ch]"
              title={`Mở sự kiện cha: ${parent.title}`}
            >
              {parent.title}
            </Link>
          ) : (
            <span className="text-purple-700 font-medium">Sự kiện cha cấp trên</span>
          )}
        </div>
      )}
    </div>
  );
}
