'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Network, Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { AccountCard } from '@/features/account/components/AccountSections';
import {
  MindmapTemplateType,
  TEMPLATE_OPTIONS,
} from '../constants/mindmap.constants';
import {
  MindmapApiService,
  type MindmapDetail,
  type MindmapSummary,
} from '../services/mindmap.service';
import { MindmapCanvas } from './MindmapCanvas';

export const MINDMAP_OPEN_ID_PARAM = 'mindmapId';

/** Tab "Sơ đồ tư duy" trên trang /tai-khoan: danh sách, tạo theo mẫu và mở Studio (có hộp thoại AI nổi song song ngay trên Canvas). */
export function MindmapsSection({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoOpenedIdRef = useRef<string | null>(null);
  const [mindmaps, setMindmaps] = useState<MindmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeMindmap, setActiveMindmap] = useState<MindmapDetail | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<MindmapTemplateType>(MindmapTemplateType.BLANK);
  const [creating, setCreating] = useState(false);

  const reloadList = useCallback(async () => {
    try {
      const list = await MindmapApiService.list();
      setMindmaps(list);
      onCountChange?.(list.length);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được danh sách sơ đồ tư duy.'));
    }
  }, [onCountChange]);

  useEffect(() => {
    let alive = true;
    MindmapApiService.list()
      .then((list) => {
        if (!alive) return;
        setMindmaps(list);
        onCountChange?.(list.length);
      })
      .catch((err) => {
        if (alive) setError(extractErrorMessage(err, 'Không tải được danh sách sơ đồ tư duy.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [onCountChange]);

  const syncMindmapUrl = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id) next.set(MINDMAP_OPEN_ID_PARAM, id);
      else next.delete(MINDMAP_OPEN_ID_PARAM);
      router.replace(`/tai-khoan?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const openMindmap = useCallback(
    async (id: string) => {
      setOpeningId(id);
      setError(null);
      try {
        const detail = await MindmapApiService.get(id);
        setActiveMindmap(detail);
        autoOpenedIdRef.current = id;
        syncMindmapUrl(id);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không mở được sơ đồ này.'));
      } finally {
        setOpeningId(null);
      }
    },
    [syncMindmapUrl],
  );

  useEffect(() => {
    const requestedId = searchParams.get(MINDMAP_OPEN_ID_PARAM);
    if (!requestedId || autoOpenedIdRef.current === requestedId) return;
    autoOpenedIdRef.current = requestedId;
    void Promise.resolve().then(() => openMindmap(requestedId));
  }, [openMindmap, searchParams]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const created = await MindmapApiService.create({
        title: title.trim() || 'Chủ đề mới',
        template,
      });
      setTitle('');
      setShowCreate(false);
      setActiveMindmap(created);
      autoOpenedIdRef.current = created.id;
      syncMindmapUrl(created.id);
      await reloadList();
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tạo được sơ đồ mới.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xoá sơ đồ tư duy này?')) return;
    try {
      await MindmapApiService.remove(id);
      await reloadList();
    } catch (err) {
      setError(extractErrorMessage(err, 'Không xoá được sơ đồ.'));
    }
  };

  if (activeMindmap) {
    return (
      <MindmapCanvas
        initialMindmap={activeMindmap}
        onBack={() => {
          setActiveMindmap(null);
          autoOpenedIdRef.current = null;
          router.replace('/tai-khoan?tab=so-do-tu-duy', { scroll: false });
          void reloadList();
        }}
      />
    );
  }

  return (
    <AccountCard
      id="so-do-tu-duy"
      icon={Network}
      eyebrow="Hệ thống hoá tri thức"
      title="Sơ đồ tư duy Lịch sử"
      action={
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-110 cursor-pointer"
        >
          <Plus size={13} /> Tạo sơ đồ mới
        </button>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {showCreate && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="mb-5 flex flex-wrap items-center gap-2.5 rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-3.5 text-xs shadow-2xs"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tên chủ đề (mặc định: Chủ đề mới)…"
            maxLength={150}
            className="min-w-[200px] flex-1 rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 px-3 py-2 font-semibold outline-none focus:border-[var(--gold,#B8893F)]"
          />
          <select
            aria-label="Mẫu khởi tạo"
            value={template}
            onChange={(e) => setTemplate(e.target.value as MindmapTemplateType)}
            className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-2 font-semibold text-stone-700 outline-none focus:border-[var(--gold,#B8893F)] cursor-pointer"
          >
            {TEMPLATE_OPTIONS.map((opt) => (
              <option key={opt.type} value={opt.type}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="rounded-xl px-3 py-2 font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A1F24] px-4 py-2 font-bold text-white hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {creating && <Loader2 size={13} className="animate-spin" />}
            Mở Studio
          </button>
        </form>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[#EAE0CB]" />
      ) : mindmaps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border,#E2D5B8)] bg-white/40 p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-page,#F5EEDC)] text-[var(--gold,#B8893F)]">
            <Network size={26} />
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)]">
            Chưa có sơ đồ tư duy nào
          </h3>
          <p className="mt-1 mx-auto max-w-md text-xs text-[var(--text-muted,#7A6B57)]">
            Bấm <strong>Tạo sơ đồ mới</strong> để chọn Sơ đồ tư duy 2 bên, Sơ đồ tổ chức, Cây logic hoặc Đối chiếu và tự do kéo thả, hoặc dùng hộp thoại AI ngay trên Canvas.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {mindmaps.map((mm) => {
            const tplLabel = TEMPLATE_OPTIONS.find((t) => t.type === mm.template)?.label ?? mm.template;
            return (
              <article
                key={mm.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-4 transition hover:border-[var(--gold,#B8893F)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-block rounded border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary,#7A1F24)]">
                        {tplLabel}
                      </span>
                      <h3 className="mt-1.5 font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)]">
                        {mm.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(mm.id)}
                      aria-label="Xoá sơ đồ"
                      className="rounded p-1 text-[var(--text-muted,#7A6B57)] hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)]">
                    {mm.periodLabel ? `${mm.periodLabel} · ` : ''}
                    {mm.nodeCount} node · {mm.edgeCount} liên kết
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--border,#E2D5B8)]/50 pt-3">
                  <span className="text-[11px] text-[var(--text-muted,#7A6B57)]">
                    Cập nhật {new Date(mm.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <button
                    type="button"
                    disabled={openingId === mm.id}
                    onClick={() => void openMindmap(mm.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    {openingId === mm.id && <Loader2 size={12} className="animate-spin" />}
                    Mở Canvas
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountCard>
  );
}
