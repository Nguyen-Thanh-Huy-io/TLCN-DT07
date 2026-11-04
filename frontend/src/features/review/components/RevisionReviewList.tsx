'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { extractErrorMessage } from '@/services/api';
import { APP_ROUTES } from '@/constants/routes';
import {
  ContentRevisionApiService,
  REVISION_TYPE_LABELS,
  type ContentRevisionItem,
  type RevisionContentType,
} from '@/services/entities/content-revision.service';
import { RevisionDetailModal } from '@/features/revisions/RevisionPanels';

const EDIT_ROUTE: Record<RevisionContentType, (id: string) => string> = {
  LESSON: APP_ROUTES.LESSONS.DETAIL,
  EVENT: APP_ROUTES.EVENTS.DETAIL,
  ENTITY: APP_ROUTES.ENTITIES.DETAIL,
  PERIOD: APP_ROUTES.PERIODS.DETAIL,
  TOPIC: APP_ROUTES.TOPICS.DETAIL,
  LEARNING_PATH: (id) => `${APP_ROUTES.CURRICULUM}?pathId=${id}`,
  // Chương không có trang riêng — mở Studio chương trình học.
  CHAPTER: () => APP_ROUTES.CURRICULUM,
};

/**
 * Trang Duyệt bài — bản sửa của nội dung đã xuất bản (bài học, sự kiện, thực thể) đang chờ duyệt.
 * Mở một bản để xem đúng các trường thay đổi, rồi Duyệt & áp dụng hoặc Từ chối.
 */
export function RevisionReviewList() {
  const [items, setItems] = useState<ContentRevisionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    ContentRevisionApiService.pending()
      .then((rows) => {
        setItems(rows);
        setError(null);
      })
      .catch((err) => setError(extractErrorMessage(err, 'Không tải được danh sách bản sửa.')));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="panel management-panel" style={{ marginBottom: 16 }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Bản sửa nội dung đã xuất bản{' '}
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{items?.length ?? '…'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Biên tập viên sửa bài học, sự kiện, nhân vật đang xuất bản — người học vẫn thấy bản cũ tới khi được duyệt. Mở để xem
            đúng phần thay đổi.
          </p>
        </div>
      </div>

      {notice && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}
      {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}

      {items && items.length === 0 && !error && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">Không có bản sửa nào đang chờ duyệt.</p>
      )}

      {items && items.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-3 py-2">Nội dung</th>
                <th className="px-3 py-2">Loại</th>
                <th className="px-3 py-2">Phiên bản</th>
                <th className="px-3 py-2">Người sửa</th>
                <th className="px-3 py-2">Cập nhật</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">
                    <Link href={EDIT_ROUTE[r.contentType](r.contentId)} className="hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{REVISION_TYPE_LABELS[r.contentType]}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">v{r.version}</td>
                  <td className="px-3 py-2.5 text-xs">{r.author?.username ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(r.updatedAt).toLocaleString('vi-VN')}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button type="button" onClick={() => setOpenId(r.id)} className="primary-button !h-8 !px-3 !text-xs">
                      Xem thay đổi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <RevisionDetailModal
          revisionId={openId}
          onClose={() => setOpenId(null)}
          onDone={(message) => {
            setOpenId(null);
            setNotice(message);
            load();
          }}
        />
      )}
    </section>
  );
}
