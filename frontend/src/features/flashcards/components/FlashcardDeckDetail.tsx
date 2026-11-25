'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Edit2, Loader2, Play, Plus, RotateCw, Search, Trash2, X } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { FlashcardApiService, type FlashcardDeck, type FlashcardItem } from '../services/flashcard.service';

enum CardStatusFilter {
  ALL = 'ALL',
  DUE = 'DUE',
  NEW = 'NEW',
  MASTERED = 'MASTERED',
}

const FILTER_LABELS: ReadonlyArray<{ id: CardStatusFilter; label: string }> = [
  { id: CardStatusFilter.ALL, label: 'Tất cả' },
  { id: CardStatusFilter.DUE, label: 'Cần ôn' },
  { id: CardStatusFilter.NEW, label: 'Thẻ mới' },
  { id: CardStatusFilter.MASTERED, label: 'Đã thuộc' },
];

function isDueCard(card: FlashcardItem, now: number): boolean {
  if (card.repetitions === 0 && !card.lastReviewedAt) return true;
  return new Date(card.nextReviewAt).getTime() <= now;
}

function formatDueBadge(card: FlashcardItem, now: number): string {
  if (card.repetitions === 0 && !card.lastReviewedAt) return 'Thẻ mới';
  const diffMs = new Date(card.nextReviewAt).getTime() - now;
  if (diffMs <= 0) return 'Đến hạn ôn';
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return days <= 1 ? 'Ôn ngày mai' : `Còn ${days} ngày`;
}

/** Chi tiết 1 bộ thẻ: thống kê tiến độ, tìm/lọc, thêm nhanh, sửa inline và bắt đầu ôn. */
export function FlashcardDeckDetail({
  deck,
  cards,
  loading,
  onBack,
  onStudyDue,
  onStudyAll,
  onCardsChange,
  onError,
}: {
  deck: FlashcardDeck;
  cards: FlashcardItem[];
  loading: boolean;
  onBack: () => void;
  onStudyDue: () => void;
  onStudyAll: () => void;
  onCardsChange: (next: FlashcardItem[]) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [now] = useState(() => Date.now());
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CardStatusFilter>(CardStatusFilter.ALL);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const stats = useMemo(() => {
    const due = cards.filter((c) => isDueCard(c, now)).length;
    const fresh = cards.filter((c) => c.repetitions === 0 && !c.lastReviewedAt).length;
    const mastered = cards.filter((c) => c.repetitions >= 2).length;
    const masteredPct = cards.length ? Math.round((mastered / cards.length) * 100) : 0;
    return { due, fresh, mastered, masteredPct };
  }, [cards, now]);

  const filteredCards = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('vi');
    return cards
      .filter((c) => {
        if (filter === CardStatusFilter.DUE) return isDueCard(c, now);
        if (filter === CardStatusFilter.NEW) return c.repetitions === 0 && !c.lastReviewedAt;
        if (filter === CardStatusFilter.MASTERED) return c.repetitions >= 2;
        return true;
      })
      .filter((c) => !needle || `${c.front} ${c.back}`.toLocaleLowerCase('vi').includes(needle));
  }, [cards, filter, now, search]);

  const handleAddCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!front.trim() || !back.trim() || adding) return;
    setAdding(true);
    onError(null);
    try {
      const created = await FlashcardApiService.createCard(deck.id, {
        front: front.trim(),
        back: back.trim(),
      });
      setFront('');
      setBack('');
      await onCardsChange([created, ...cards]);
    } catch (err) {
      onError(extractErrorMessage(err, 'Không thêm được thẻ mới.'));
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (card: FlashcardItem) => {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const saveEdit = async (cardId: string) => {
    if (!editFront.trim() || !editBack.trim() || savingEdit) return;
    setSavingEdit(true);
    onError(null);
    try {
      const updated = await FlashcardApiService.updateCard(cardId, {
        front: editFront.trim(),
        back: editBack.trim(),
      });
      setEditingId(null);
      await onCardsChange(cards.map((c) => (c.id === cardId ? updated : c)));
    } catch (err) {
      onError(extractErrorMessage(err, 'Không cập nhật được thẻ.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await FlashcardApiService.deleteCard(cardId);
      await onCardsChange(cards.filter((c) => c.id !== cardId));
    } catch (err) {
      onError(extractErrorMessage(err, 'Không xoá được thẻ.'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Đầu trang + nút ôn */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)] cursor-pointer"
        >
          <ArrowLeft size={14} /> Tất cả bộ thẻ
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={cards.length === 0}
            onClick={onStudyAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)] disabled:opacity-45 cursor-pointer"
          >
            <RotateCw size={13} /> Ôn tất cả ({cards.length})
          </button>
          <button
            type="button"
            disabled={stats.due === 0}
            onClick={onStudyDue}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-45 cursor-pointer"
          >
            <Play size={13} /> Ôn đến hạn ({stats.due})
          </button>
        </div>
      </div>

      {/* Thống kê bộ thẻ */}
      <div className="rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/50 p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)]">
            {deck.title}
          </h3>
          <span className="text-xs font-bold text-[var(--primary,#7A1F24)]">
            Đã thuộc {stats.masteredPct}%
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAE0CB]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#B8893F] to-[#7A1F24] transition-all duration-300"
            style={{ width: `${stats.masteredPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-2">
            <div className="text-[11px] text-[var(--text-muted,#7A6B57)]">Tổng số thẻ</div>
            <div className="font-bold text-[var(--text-body,#2D1A10)]">{cards.length}</div>
          </div>
          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-2">
            <div className="text-[11px] text-[var(--text-muted,#7A6B57)]">Cần ôn ngay</div>
            <div className="font-bold text-[var(--primary,#7A1F24)]">{stats.due}</div>
          </div>
          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-2">
            <div className="text-[11px] text-[var(--text-muted,#7A6B57)]">Thẻ mới</div>
            <div className="font-bold text-[var(--gold,#B8893F)]">{stats.fresh}</div>
          </div>
          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-2">
            <div className="text-[11px] text-[var(--text-muted,#7A6B57)]">Đã thuộc</div>
            <div className="font-bold text-teal-700">{stats.mastered}</div>
          </div>
        </div>
      </div>

      {/* Form thêm thẻ */}
      <form onSubmit={(e) => void handleAddCard(e)} className="grid gap-3 rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-4 sm:grid-cols-2">
        <label className="space-y-1 text-xs">
          <span className="font-bold text-[var(--text-body,#2D1A10)]">Mặt trước (Câu hỏi / Thuật ngữ)</span>
          <textarea
            rows={2}
            required
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="VD: Chiến thắng Bạch Đằng năm 938 do ai lãnh đạo?"
            className="w-full rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-2 text-xs outline-none focus:border-[var(--gold,#B8893F)]"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-bold text-[var(--text-body,#2D1A10)]">Mặt sau (Đáp án / Giải thích)</span>
          <textarea
            rows={2}
            required
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="VD: Ngô Quyền — đánh tan quân Nam Hán, mở ra kỷ nguyên độc lập."
            className="w-full rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-2 text-xs outline-none focus:border-[var(--gold,#B8893F)]"
          />
        </label>
        <div className="flex justify-end sm:col-span-2">
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary,#7A1F24)] px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Thêm thẻ vào bộ
          </button>
        </div>
      </form>

      {/* Tìm kiếm & lọc thẻ */}
      {cards.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="relative min-w-[200px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted,#7A6B57)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh trong bộ thẻ…"
              className="w-full rounded-xl border border-[var(--border,#E2D5B8)] bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[var(--gold,#B8893F)]"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {FILTER_LABELS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                  filter === item.id
                    ? 'border-[var(--primary,#7A1F24)] bg-[var(--primary,#7A1F24)] text-white'
                    : 'border-[var(--border,#E2D5B8)] bg-white text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách thẻ */}
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-[var(--text-muted,#7A6B57)]">
          <Loader2 size={14} className="animate-spin" /> Đang tải thẻ…
        </p>
      ) : cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border,#E2D5B8)] bg-white/40 py-8 text-center text-xs text-[var(--text-muted,#7A6B57)]">
          Bộ thẻ chưa có thẻ nào. Hãy thêm thẻ đầu tiên ở trên hoặc bấm <strong>Tạo thẻ</strong> ngay khi đang đọc bài viết / bài học.
        </p>
      ) : filteredCards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border,#E2D5B8)] bg-white/40 py-6 text-center text-xs text-[var(--text-muted,#7A6B57)]">
          Không có thẻ nào khớp bộ lọc.
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredCards.map((card) => (
            <li key={card.id} className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-3.5">
              {editingId === card.id ? (
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <textarea
                      rows={3}
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      className="rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-2 text-xs leading-relaxed outline-none"
                    />
                    <textarea
                      rows={4}
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      className="rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-2 text-xs leading-relaxed outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      <X size={12} /> Huỷ
                    </button>
                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={() => void saveEdit(card.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary,#7A1F24)] px-3 py-1 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                    >
                      {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <div className="whitespace-pre-line text-xs font-bold leading-relaxed text-[var(--text-body,#2D1A10)]">{card.front}</div>
                    <div className="whitespace-pre-line text-xs leading-relaxed text-[var(--text-muted,#7A6B57)]">{card.back}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary,#7A1F24)]">
                      {formatDueBadge(card, now)}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(card)}
                      aria-label="Sửa thẻ"
                      className="rounded p-1 text-[var(--text-muted,#7A6B57)] hover:bg-stone-100 hover:text-[var(--text-body,#2D1A10)] cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCard(card.id)}
                      aria-label="Xoá thẻ"
                      className="rounded p-1 text-[var(--text-muted,#7A6B57)] hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
