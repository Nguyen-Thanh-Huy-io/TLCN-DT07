'use client';
import { ContentStatus } from '@/constants/enums';

import { useCallback, useEffect, useState } from 'react';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import {
  ContentRevisionApiService,
  REVISION_TYPE_LABELS,
  RevisionKind,
  RevisionStatus,
  type ContentRevisionItem,
  type RevisionChange,
  type RevisionContentType,
  type RevisionHistoryItem,
  type RevisionLabels,
} from '@/services/entities/content-revision.service';
import { RevisionDiff } from './RevisionDiff';

const formatTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '');

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
  const [data, setData] = useState<{
    revision: ContentRevisionItem;
    changes: RevisionChange[];
    labels: RevisionLabels;
  } | null>(null);
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
  const isProposal = rev?.kind === RevisionKind.PROPOSAL;
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
              &quot;Trước&quot; là bản đang xuất bản, &quot;Sau&quot; là phiên bản v{rev.version} — khôi phục sẽ đưa các trường dưới đây về
              như phiên bản đó.
            </p>
          )}
          {data ? (
            <RevisionDiff changes={data.changes} labels={data.labels} />
          ) : (
            !error && <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          )}
          {rev?.status === RevisionStatus.REJECTED && rev.reviewNote && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">Lý do từ chối: {rev.reviewNote}</p>
          )}
        </div>

        {rev && isReviewer && (isProposal ? rev.status === RevisionStatus.PENDING : true) && (
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

/** Màu / nhãn mốc trên dòng thời gian phiên bản. */
const NODE_STYLE: Record<ContentRevisionItem['status'], { dot: string; badge: string; text: string }> = {
  PENDING: { dot: 'bg-amber-500 ring-amber-100', badge: 'bg-amber-100 text-amber-800', text: 'Chờ duyệt' },
  APPROVED: { dot: 'bg-emerald-500 ring-emerald-100', badge: 'bg-emerald-100 text-emerald-800', text: 'Đã duyệt' },
  REJECTED: { dot: 'bg-rose-500 ring-rose-100', badge: 'bg-rose-100 text-rose-800', text: 'Bị từ chối' },
  ARCHIVED: { dot: 'bg-slate-400 ring-slate-100', badge: 'bg-slate-100 text-slate-600', text: 'Phiên bản cũ' },
};

function FieldChips({ fields }: { fields: string[] }) {
  if (!fields.length) return <span className="text-xs text-slate-400">Không đổi trường nào</span>;
  const shown = fields.slice(0, 6);
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((f) => (
        <span key={f} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
          {f}
        </span>
      ))}
      {fields.length > shown.length && <span className="text-[11px] text-slate-400">+{fields.length - shown.length} trường</span>}
    </div>
  );
}

/** Hộp "Lịch sử phiên bản": dòng thời gian từ bản đang xuất bản ngược về các phiên bản cũ. */
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
  const [history, setHistory] = useState<{ liveVersion: number; items: RevisionHistoryItem[] } | null>(null);
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

  // Mốc mới nhất trước: bản sửa theo lúc cập nhật, phiên bản cũ theo lúc bị thay thế.
  const items = [...(history?.items ?? [])].sort(
    (a, b) =>
      new Date(b.kind === RevisionKind.PROPOSAL ? b.updatedAt : b.createdAt).getTime() -
      new Date(a.kind === RevisionKind.PROPOSAL ? a.updatedAt : a.createdAt).getTime(),
  );

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/30 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lịch sử phiên bản</h3>
            <p className="text-xs text-slate-500">Mỗi mốc là một lần thay đổi; bấm để xem đúng phần khác biệt.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-slate-700">
            Đóng
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          {!history && !error && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}
          {history && (
            <ol className="relative ml-2 border-l-2 border-slate-200">
              <li className="relative mb-5 pl-6">
                <span className="absolute -left-[9px] top-1 size-4 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-700">v{history.liveVersion}</span>
                  <span className="text-sm font-bold text-slate-900">Đang xuất bản</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Hiện tại</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">Người học đang thấy phiên bản này.</p>
              </li>
              {items.length === 0 && (
                <li className="relative pl-6 text-sm text-slate-500">
                  <span className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-slate-300" />
                  Chưa có thay đổi nào — lịch sử bắt đầu từ lần sửa đầu tiên sau khi xuất bản.
                </li>
              )}
              {items.map((item) => {
                const style = NODE_STYLE[item.status];
                const proposal = item.kind === RevisionKind.PROPOSAL;
                return (
                  <li key={item.id} className="relative mb-5 pl-6 last:mb-0">
                    <span className={`absolute -left-[8px] top-1.5 size-3.5 rounded-full ring-4 ${style.dot}`} />
                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">v{item.version}</span>
                        <span className="text-sm font-semibold text-slate-800">
                          {proposal ? 'Bản sửa đề xuất' : 'Phiên bản đã được thay thế'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>{style.text}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {proposal
                          ? `${item.author?.username ?? 'không rõ'} đề xuất · ${formatTime(item.updatedAt)}`
                          : `Bị thay lúc ${formatTime(item.createdAt)} bởi ${item.author?.username ?? 'không rõ'}`}
                        {proposal && item.reviewer && item.status !== RevisionStatus.PENDING &&
                          ` · ${item.reviewer.username} ${item.status === RevisionStatus.APPROVED ? 'duyệt' : 'từ chối'} ${formatTime(item.reviewedAt)}`}
                      </p>
                      <div className="mt-2">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {proposal ? 'Trường được sửa' : 'Lần thay đổi sau đó đã đổi'}
                        </div>
                        <FieldChips fields={item.changedFields ?? []} />
                      </div>
                      {item.status === RevisionStatus.REJECTED && item.reviewNote && (
                        <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-800">Lý do: {item.reviewNote}</p>
                      )}
                      <span className="mt-2 inline-block text-xs font-semibold text-sky-700">
                        {proposal ? 'Xem thay đổi →' : 'Xem khác biệt & khôi phục →'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
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
  if (!contentId || status !== ContentStatus.PUBLISHED) return null;

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
