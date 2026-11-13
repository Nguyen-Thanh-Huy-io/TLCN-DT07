'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { ActionMenu } from '@/components/common/ActionMenu';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { extractErrorMessage } from '@/services/api';
import { TimelineApiService, type TimelineItem } from '@/services/entities/timeline.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { StatusPill } from '@/features/articles/components/StatusPill';

/** Danh sách dòng thời gian (số lượng nhỏ — tải 1 lần, tìm phía client). */
export function TimelineList() {
  const router = useRouter();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<TimelineItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await TimelineApiService.list({ limit: 100 })).items);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được danh sách dòng thời gian.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await TimelineApiService.remove(deleting.id);
      load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Xoá dòng thời gian thất bại.'));
    } finally {
      setDeleting(null);
    }
  };

  const visible = items.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="panel management-panel">
      <div className="toolbar">
        <label className="search-box">
          <Icon name={IconName.SEARCH} size={15} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm dòng thời gian…"
            className="text-slate-800 placeholder:text-slate-500 font-medium text-xs sm:text-sm"
          />
        </label>
        <button
          type="button"
          className="primary-button !h-9 !px-3.5 !text-xs sm:!text-sm font-bold ml-auto"
          onClick={() => router.push(APP_ROUTES.TIMELINES.CREATE)}
        >
          <Icon name={IconName.PLUS} size={15} />
          Tạo dòng thời gian
        </button>
      </div>
      {error && <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th>TIÊU ĐỀ</th>
              <th>CHỦ ĐỀ (TOPIC)</th>
              <th>SỐ MỐC</th>
              <th>THỨ TỰ</th>
              <th>TRẠNG THÁI</th>
              <th>CẬP NHẬT</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Chưa có dòng thời gian nào.
                </td>
              </tr>
            ) : (
              visible.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => router.push(APP_ROUTES.TIMELINES.DETAIL(t.id))}>
                  <td>
                    <strong className="text-sm font-semibold text-slate-900">{t.title}</strong>
                    {t.description && <div className="line-clamp-1 text-xs text-slate-500">{t.description}</div>}
                  </td>
                  <td className="text-sm text-slate-700">
                    {t.topic ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {t.topic.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="text-sm text-slate-700">{t._count?.nodes ?? 0}</td>
                  <td className="text-sm text-slate-700">{t.displayOrder}</td>
                  <td>
                    <StatusPill status={t.status} />
                  </td>
                  <td className="text-xs text-slate-500">{new Date(t.updatedAt).toLocaleDateString('vi-VN')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      onEdit={() => router.push(APP_ROUTES.TIMELINES.DETAIL(t.id))}
                      onView={() => window.open(PUBLIC_ROUTES.TIMELINE(t.slug), '_blank')}
                      onDelete={() => setDeleting(t)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={deleting?.title || ''}
        itemTypeLabel="dòng thời gian"
      />
    </div>
  );
}
