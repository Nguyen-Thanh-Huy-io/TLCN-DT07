'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FolderTree, X } from 'lucide-react';
import { TopicApiService } from '@/services/entities/topic.service';
import type { TopicItem } from '@/types/models';
import { TopicParentModalPicker } from './TopicParentModalPicker';

export interface PickedTopic {
  id: string;
  name: string;
  slug?: string;
}

/**
 * Ô chọn Chủ đề / Thời kỳ lịch sử theo cây phân cấp Cha → Con (tái sử dụng `TopicParentModalPicker`
 * giống bên Bài học, thay cho dropdown xổ phẳng).
 */
export function TopicPicker({
  value,
  onChange,
  placeholder = 'Chưa gắn vào Chủ đề nào',
}: {
  value: PickedTopic | null;
  onChange: (topic: PickedTopic | null) => void;
  placeholder?: string;
}) {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    TopicApiService.getTopics({ limit: 100 })
      .then((res) => {
        if (active) setTopics(res.items || []);
      })
      .catch(() => {
        if (active) setTopics([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const breadcrumbPath = useMemo(() => {
    if (!value) return null;
    const byId = new Map(topics.map((t) => [t.id, t]));
    const current = byId.get(value.id);
    if (!current) return value.name;
    const parts: string[] = [current.name];
    let parentId = current.parentId;
    while (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId)!;
      parts.unshift(parent.name);
      parentId = parent.parentId;
    }
    return parts.join(' › ');
  }, [value, topics]);

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-900">
            {value ? value.name : placeholder}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {breadcrumbPath && breadcrumbPath !== value?.name
              ? breadcrumbPath
              : value
                ? 'Chủ đề gốc trong cây tri thức'
                : 'Chọn chủ đề theo nhánh Cha › Con trên cây kiến thức'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              title="Bỏ chọn chủ đề"
              aria-label="Bỏ chọn chủ đề"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs transition hover:border-blue-300 hover:text-blue-800 cursor-pointer"
          >
            <FolderTree size={13} />
            <span>{value ? 'Đổi chủ đề' : 'Chọn chủ đề'}</span>
          </button>
        </div>
      </div>

      <TopicParentModalPicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(selectedId) => {
          if (!selectedId) {
            onChange(null);
            return;
          }
          const found = topics.find((t) => t.id === selectedId);
          if (found) {
            onChange({ id: found.id, name: found.name });
          }
        }}
        topics={topics}
        selectedParentId={value?.id ?? null}
        title="Chọn Chủ đề (Topic)"
        subtitle="Duyệt theo nhánh Chủ đề gốc › Chủ đề con hoặc tìm nhanh theo tên"
        allowRootSelect
        rootLabel="Không gắn Chủ đề"
        rootDescription="Để trống chủ đề (bài viết hoặc dòng thời gian độc lập)"
        maxDepth={null}
      />
    </>
  );
}
