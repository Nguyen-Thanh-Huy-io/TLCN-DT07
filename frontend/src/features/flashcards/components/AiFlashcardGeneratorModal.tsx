'use client';

import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { fetchSavedArticleIds } from '@/features/saved-materials/services/saved-material.service';
import { extractErrorMessage } from '@/services/api';
import { AI_CARD_COUNT_OPTIONS, AiGeneratorEngine } from '../constants/flashcard.constants';
import {
  FlashcardApiService,
  type GeneratedCardDraft,
} from '../services/flashcard.service';

interface EditableDraft extends GeneratedCardDraft {
  selected: boolean;
}

/** Hộp thoại AI phân tích Ghi chú & Bài viết đã lưu để tạo bộ thẻ ghi nhớ. */
export function AiFlashcardGeneratorModal({
  onCreated,
  onClose,
}: {
  onCreated: () => Promise<void>;
  onClose: () => void;
}) {
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeWrongQuizzes, setIncludeWrongQuizzes] = useState(true);
  const [includeArticles, setIncludeArticles] = useState(false);
  const [maxCards, setMaxCards] = useState<number>(10);

  useEffect(() => {
    let alive = true;
    void fetchSavedArticleIds().then((ids) => {
      if (!alive) return;
      setSavedArticleIds(ids);
      setIncludeArticles(ids.length > 0);
    });
    return () => {
      alive = false;
    };
  }, []);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deckTitle, setDeckTitle] = useState('');
  const [engine, setEngine] = useState<AiGeneratorEngine | null>(null);
  const [drafts, setDrafts] = useState<EditableDraft[] | null>(null);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await FlashcardApiService.generatePreview({
        includeNotes,
        includeWrongQuizzes,
        articleIds: includeArticles ? savedArticleIds : [],
        maxCards,
      });
      setDeckTitle(res.deckTitle);
      setEngine(res.engine);
      setDrafts(res.cards.map((c) => ({ ...c, selected: true })));
    } catch (err) {
      setError(extractErrorMessage(err, 'Không phân tích được dữ liệu để tạo thẻ.'));
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = drafts ? drafts.filter((d) => d.selected && d.front.trim() && d.back.trim()).length : 0;

  const handleSaveDeck = async () => {
    if (!drafts || selectedCount === 0 || !deckTitle.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const cards = drafts
        .filter((d) => d.selected && d.front.trim() && d.back.trim())
        .map(({ front, back, sourceNoteId }) => ({
          front: front.trim(),
          back: back.trim(),
          ...(sourceNoteId ? { sourceNoteId } : {}),
        }));
      await FlashcardApiService.createDeckBatch({
        title: deckTitle.trim(),
        cards,
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Không lưu được bộ thẻ mới.'));
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (idx: number, patch: Partial<EditableDraft>) => {
    setDrafts((prev) => prev?.map((d, i) => (i === idx ? { ...d, ...patch } : d)) ?? null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tạo bộ thẻ ghi nhớ bằng AI"
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border,#E2D5B8)] bg-[#FFFCF5] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border,#E2D5B8)] px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-base font-bold text-[var(--primary,#7A1F24)]">
            <Sparkles size={17} className="text-[var(--gold,#B8893F)]" />
            Tạo bộ Flashcards bằng AI
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </p>
          )}

          {!drafts ? (
            <div className="space-y-4">
              <p className="leading-relaxed text-stone-600">
                AI sẽ đọc <strong>ghi chú cá nhân</strong> và <strong>bài viết đã lưu</strong> của bạn để tổng hợp thành bộ thẻ câu hỏi – đáp án phục vụ ôn tập SM-2.
              </p>

              <div className="space-y-2 rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-4">
                <div className="font-bold text-stone-800">Chọn nguồn dữ liệu phân tích</div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="size-4 accent-[#7A1F24]"
                  />
                  <span>Ghi chú & đánh dấu đã lưu trong tài khoản</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWrongQuizzes}
                    onChange={(e) => setIncludeWrongQuizzes(e.target.checked)}
                    className="size-4 accent-[#7A1F24]"
                  />
                  <span>Câu hỏi từng làm sai trong Quiz (kèm đáp án & giải thích)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeArticles}
                    disabled={savedArticleIds.length === 0}
                    onChange={(e) => setIncludeArticles(e.target.checked)}
                    className="size-4 accent-[#7A1F24]"
                  />
                  <span>
                    Bài viết đã ghim trong Tủ sách ({savedArticleIds.length} bài)
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-stone-800">Số lượng thẻ tối đa</div>
                <div className="flex gap-2">
                  {AI_CARD_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setMaxCards(count)}
                      className={`rounded-xl border px-3.5 py-1.5 font-bold cursor-pointer ${
                        maxCards === count
                          ? 'border-[#7A1F24] bg-[#7A1F24] text-white'
                          : 'border-[var(--border,#E2D5B8)] bg-white text-stone-700 hover:border-[var(--gold,#B8893F)]'
                      }`}
                    >
                      {count} thẻ
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border,#E2D5B8)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--primary,#7A1F24)]">
                  <Sparkles size={12} className="text-[var(--gold,#B8893F)]" />
                  {engine === AiGeneratorEngine.GEMINI_FLASH ? 'Sinh bởi Gemini AI' : 'Tổng hợp tự động từ ghi chú & bài viết'}
                </span>
                <button
                  type="button"
                  onClick={() => setDrafts(null)}
                  className="text-xs font-bold text-[#7A1F24] hover:underline cursor-pointer"
                >
                  Chọn lại nguồn
                </button>
              </div>

              <label className="block space-y-1">
                <span className="font-bold text-stone-800">Tên bộ thẻ</span>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  maxLength={150}
                  className="w-full rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[var(--gold,#B8893F)]"
                />
              </label>

              <ul className="space-y-2.5">
                {drafts.map((card, idx) => (
                  <li
                    key={idx}
                    className={`rounded-xl border p-3 transition ${
                      card.selected
                        ? 'border-[var(--border,#E2D5B8)] bg-white'
                        : 'border-stone-200 bg-stone-50 opacity-60'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 font-bold text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={card.selected}
                          onChange={(e) => updateDraft(idx, { selected: e.target.checked })}
                          className="size-3.5 accent-[#7A1F24]"
                        />
                        Thẻ #{idx + 1}
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <textarea
                        rows={2}
                        value={card.front}
                        onChange={(e) => updateDraft(idx, { front: e.target.value })}
                        placeholder="Mặt trước"
                        className="rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-2 text-xs outline-none"
                      />
                      <textarea
                        rows={2}
                        value={card.back}
                        onChange={(e) => updateDraft(idx, { back: e.target.value })}
                        placeholder="Mặt sau"
                        className="rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-2 text-xs outline-none"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border,#E2D5B8)] bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            Đóng
          </button>
          {!drafts ? (
            <button
              type="button"
              disabled={
                generating ||
                (!includeNotes &&
                  !includeWrongQuizzes &&
                  (!includeArticles || savedArticleIds.length === 0))
              }
              onClick={() => void handleGenerate()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Phân tích & Tạo thẻ
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || selectedCount === 0 || !deckTitle.trim()}
              onClick={() => void handleSaveDeck()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Lưu bộ thẻ ({selectedCount} thẻ)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
