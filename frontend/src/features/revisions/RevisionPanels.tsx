'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import {
  ContentRevisionApiService,
  REVISION_TYPE_LABELS,
  type ContentRevisionItem,
  type RevisionChange,
  type RevisionContentType,
} from '@/services/entities/content-revision.service';
import { usePublicTaxonomyTerms } from '@/features/taxonomy/usePublicTaxonomy';
import { RevisionDiff } from './RevisionDiff';

const formatTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '');

/** Đổi id / mã danh mục sang nhãn để phần so sánh dễ đọc. */
function useRevisionLabelOf() {
  const categories = usePublicTaxonomyTerms('EVENT_CATEGORY');
  const roles = usePublicTaxonomyTerms('FIGURE_ROLE');
  return useMemo(() => {
    const byKey = new Map<string, string>();
    for (const t of [...categories, ...roles]) {
      byKey.set(t.id, t.label);
      byKey.set(t.code, t.label);
    }
    return (value: string) => byKey.get(value) ?? value;
  }, [categories, roles]);
}

/** Hộp xem một phiên bản: các trường thay đổi + Duyệt / Từ chối (bản sửa) hoặc Khôi phục (lịch sử). */
export function RevisionDetailModal({
  revisionId,
  onClose,
  onDone,
}: {
  revisionId: string;
  onClose: () => void;
  /** Sau khi duyệt / từ chối / khôi phục thành công. */
  onDone: (message: string) => void;
}) {
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));
  const labelOf = useRevisionLabelOf();
  const [data, setData] = useState<{ revision: ContentRevisionItem; changes: RevisionChange[] } | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    ContentRevisionApiService.detail(revisionId)
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(extractErrorMessage(err, 'Không tải được phiên bản.')));
    return () => {
      alive = false;
    };
  }, [revisionId]);

  const rev = data?.revision;
  const isProposal = rev?.kind === 'PROPOSAL';
  const isOwn = Boolean(rev && user && rev.authorId === user.id);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone(message);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thực hiện được thao tác.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
              {rev ? `${REVISION_TYPE_LABELS[rev.contentType]} · ${isProposal ? `Bản sửa v${rev.version}` : `Phiên bản v${rev.version}`}` : 'Phiên bản'}
            </div>
            <h3 className="text-base font-bold text-slate-900">{rev?.title ?? 'Đang tải...'}</h3>
            {rev && (
              <p className="text-xs text-slate-500">
                {isProposal
                  ? `Đề xuất bởi ${rev.author?.username ?? 'không rõ'} · cập nhật ${formatTime(rev.updatedAt)}`
                  : `Bị thay thế lúc ${formatTime(rev.createdAt)} bởi ${rev.author?.username ?? 'không rõ'}`}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-slate-700">
            Đóng
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
          {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}
          {!isProposal && rev && (
            <p className="mb-3 text-xs text-slate-500">
              So sánh bản đang xuất bản với phiên bản v{rev.version} — khôi phục sẽ đưa các trường dưới đây về như cột bên phải.
            </p>
          )}
          {data ? (
            <RevisionDiff
              changes={data.changes}
              labelOf={labelOf}
              afterLabel={isProposal ? 'Bản sửa' : `Phiên bản v${rev?.version}`}
            />
          ) : (
            !error && <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          )}
          {rev?.status === 'REJECTED' && rev.reviewNote && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">Lý do từ chối: {rev.reviewNote}</p>
          )}
        </div>

        {rev && isReviewer && (isProposal ? rev.status === 'PENDING' : true) && (
          <div className="space-y-2 border-t border-slate-100 px-5 py-4">
            {isProposal ? (
              <>
                {isOwn && <p className="text-xs font-semibold text-amber-700">Đây là bản sửa của bạn — cần người duyệt khác.</p>}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú cho người sửa (bắt buộc khi từ chối)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy || !note.trim()}
                    onClick={() => run(() => ContentRevisionApiService.reject(rev.id, note), 'Đã từ chối bản sửa.')}
                    className="secondary-button !h-9 !px-4 !text-xs disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    disabled={busy || isOwn}
                    onClick={() => run(() => ContentRevisionApiService.approve(rev.id, note), 'Đã duyệt — nội dung công khai đã cập nhật.')}
                    className="primary-button !h-9 !px-4 !text-xs disabled:opacity-50"
                  >
                    {busy ? 'Đang xử lý...' : 'Duyệt & áp dụng'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={busy || data?.changes.length === 0}
                  onClick={() =>
                    run(() => ContentRevisionApiService.restore(rev.id), `Đã khôi phục phiên bản v${rev.version} (bản hiện tại được lưu vào lịch sử).`)
                  }
                  className="primary-button !h-9 !px-4 !text-xs disabled:opacity-50"
                >
                  {busy ? 'Đang khôi phục...' : `Khôi phục phiên bản v${rev.version}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_BADGES: Record<ContentRevisionItem['status'], { text: string; cls: string }> = {
  PENDING: { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800' },
  APPROVED: { text: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { text: 'Bị từ chối', cls: 'bg-rose-100 text-rose-800' },
  ARCHIVED: { text: 'Phiên bản cũ', cls: 'bg-slate-100 text-slate-600' },
};

/** Hộp "Lịch sử phiên bản" của một nội dung. */
export function RevisionHistoryModal({
  type,
  contentId,
  onClose,
  onChanged,
}: {
  type: RevisionContentType;
  contentId: string;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const [history, setHistory] = useState<{ liveVersion: number; items: ContentRevisionItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    ContentRevisionApiService.history(type, contentId)
      .then(setHistory)
      .catch((err) => setError(extractErrorMessage(err, 'Không tải được lịch sử phiên bản.')));
  }, [type, contentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/30 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lịch sử phiên bản</h3>
            {history && <p className="text-xs text-slate-500">Đang xuất bản: phiên bản v{history.liveVersion}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-slate-700">
            Đóng
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-3">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          {history && history.items.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              Chưa có phiên bản nào — lịch sử bắt đầu từ lần sửa đầu tiên sau khi xuất bản.
            </p>
          )}
          <ul className="divide-y divide-slate-100">
            {history?.items.map((item) => {
              const badge = STATUS_BADGES[item.status];
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => setOpenId(item.id)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50">
                    <span className="w-10 font-mono text-xs font-bold text-slate-500">v{item.version}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {item.kind === 'PROPOSAL' ? 'Bản sửa đề xuất' : 'Phiên bản đã thay thế'}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {item.kind === 'PROPOSAL'
                          ? `${item.author?.username ?? 'không rõ'} · ${formatTime(item.updatedAt)}`
                          : `thay bởi ${item.author?.username ?? 'không rõ'} · ${formatTime(item.createdAt)}`}
                        {item.reviewer && item.kind === 'PROPOSAL' && item.status !== 'PENDING' && ` · ${item.reviewer.username} xử lý`}
                      </span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {openId && (
        <RevisionDetailModal
          revisionId={openId}
          onClose={() => setOpenId(null)}
          onDone={(message) => {
            setOpenId(null);
            load();
            onChanged(message);
          }}
        />
      )}
    </div>
  );
}

/**
 * Dải thông báo trong form CMS của nội dung có phiên bản hóa: cho biết lưu sẽ thành bản sửa chờ
 * duyệt (biên tập viên + nội dung đang xuất bản), bản sửa đang mở, và nút Lịch sử phiên bản.
 */
export function EditorRevisionBanner({
  type,
  contentId,
  status,
  pending,
  notice,
  onChanged,
}: {
  type: RevisionContentType;
  contentId: string | null | undefined;
  status: string | null | undefined;
  pending: ContentRevisionItem | null;
  /** Thông báo vừa xảy ra (vd. "Đã gửi bản sửa chờ duyệt"). */
  notice?: string | null;
  /** Sau khi duyệt / khôi phục từ hộp lịch sử — form nên tải lại. */
  onChanged: (message: string) => void;
}) {
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  if (!contentId || status !== 'PUBLISHED') return null;

  return (
    <div className="mb-4 space-y-2">
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="min-w-0 flex-1">
          {pending && isReviewer ? (
            <>
              <strong>Có bản sửa v{pending.version} chờ duyệt</strong> ({pending.author?.username ?? 'không rõ'} ·{' '}
              {formatTime(pending.updatedAt)}). Form đang hiện bản đang xuất bản — mở bản sửa để xem thay đổi và duyệt.
            </>
          ) : pending ? (
            <>
              <strong>Đang mở bản sửa v{pending.version} chờ duyệt</strong> ({pending.author?.username ?? 'không rõ'} ·{' '}
              {formatTime(pending.updatedAt)}). Form đang hiện bản sửa; người học vẫn thấy bản đang xuất bản. Lưu tiếp sẽ cập nhật
              bản sửa này.
            </>
          ) : isReviewer ? (
            <>Nội dung đang xuất bản — bạn là người duyệt nên thay đổi được áp dụng ngay; bản hiện tại tự lưu vào lịch sử.</>
          ) : (
            <>
              <strong>Nội dung đang xuất bản.</strong> Lưu sẽ tạo bản sửa chờ người duyệt chấp thuận — bản công khai giữ nguyên tới
              khi được duyệt.
            </>
          )}
        </div>
        {pending && isReviewer && (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Xem & duyệt bản sửa
          </button>
        )}
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          Lịch sử phiên bản
        </button>
      </div>
      {reviewOpen && pending && (
        <RevisionDetailModal
          revisionId={pending.id}
          onClose={() => setReviewOpen(false)}
          onDone={(message) => {
            setReviewOpen(false);
            onChanged(message);
          }}
        />
      )}
      {historyOpen && (
        <RevisionHistoryModal
          type={type}
          contentId={contentId}
          onClose={() => setHistoryOpen(false)}
          onChanged={(message) => {
            setHistoryOpen(false);
            onChanged(message);
          }}
        />
      )}
    </div>
  );
}
