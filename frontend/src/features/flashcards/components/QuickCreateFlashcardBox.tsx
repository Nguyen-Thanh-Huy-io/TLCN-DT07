'use client';

import React, { useEffect, useState } from 'react';
import { Check, FolderPlus, Loader2 } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { DEFAULT_NOTE_DECK_TITLE } from '../constants/flashcard.constants';
import { FlashcardApiService, type FlashcardDeck } from '../services/flashcard.service';

/** Hộp tạo nhanh 1 thẻ ghi nhớ (dùng chung ở Thanh đọc bài, Sổ ghi chú và Tủ sách cá nhân). */
export function QuickCreateFlashcardBox({
  initialFront,
  initialBack,
  sourceNoteId,
  onSaved,
  onCancel,
}: {
  initialFront: string;
  initialBack: string;
  sourceNoteId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [creatingNewDeck, setCreatingNewDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    FlashcardApiService.listDecks()
      .then((list) => {
        if (!alive) return;
        setDecks(list);
        if (list[0]) setSelectedDeckId(list[0].id);
      })
      .catch(() => {
        // Nếu chưa đăng nhập hoặc lỗi mạng, người dùng sẽ thấy thông báo khi bấm Lưu.
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async () => {
    if (!front.trim() || !back.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      let deckId = selectedDeckId;
      if (creatingNewDeck && newDeckTitle.trim()) {
        const createdDeck = await FlashcardApiService.createDeck({ title: newDeckTitle.trim() });
        deckId = createdDeck.id;
      } else if (!deckId) {
        const createdDeck = await FlashcardApiService.createDeck({ title: DEFAULT_NOTE_DECK_TITLE });
        deckId = createdDeck.id;
      }
      await FlashcardApiService.createCard(deckId, {
        front: front.trim(),
        back: back.trim(),
        ...(sourceNoteId ? { sourceNoteId } : {}),
      });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Đăng nhập để tạo thẻ ghi nhớ vào tài khoản.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 pt-1 text-xs">
      <label className="block space-y-1">
        <span className="font-bold text-stone-700">Mặt trước · Câu hỏi / Thuật ngữ</span>
        <textarea
          rows={2}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Nhập câu hỏi, sự kiện hoặc thuật ngữ cần nhớ…"
          className="w-full resize-none rounded-lg border border-[var(--border,#E2D5B8)] bg-white p-2 text-xs leading-relaxed text-stone-900 outline-none focus:border-[var(--gold,#B8893F)]"
        />
      </label>

      <label className="block space-y-1">
        <span className="font-bold text-stone-700">Mặt sau · Đáp án / Giải thích</span>
        <textarea
          rows={2}
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Nhập đáp án, năm diễn ra hoặc ý nghĩa lịch sử…"
          className="w-full resize-none rounded-lg border border-[var(--border,#E2D5B8)] bg-white p-2 text-xs leading-relaxed text-stone-900 outline-none focus:border-[var(--gold,#B8893F)]"
        />
      </label>

      {/* Chọn bộ thẻ dạng chip (không dùng dropdown), cho phép tạo bộ mới ngay */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-700">Lưu vào bộ thẻ</span>
          <button
            type="button"
            onClick={() => setCreatingNewDeck((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A1F24] hover:underline cursor-pointer"
          >
            <FolderPlus size={12} /> {creatingNewDeck ? 'Chọn bộ có sẵn' : 'Tạo bộ mới'}
          </button>
        </div>

        {creatingNewDeck ? (
          <input
            type="text"
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            placeholder="Tên bộ thẻ mới…"
            maxLength={150}
            className="w-full rounded-lg border border-[var(--gold,#B8893F)] bg-white px-2.5 py-1.5 text-xs text-stone-900 outline-none"
          />
        ) : decks.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {decks.map((d) => {
              const active = selectedDeckId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDeckId(d.id)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    active
                      ? 'border-[#7A1F24] bg-[#7A1F24] text-white'
                      : 'border-[var(--border,#E2D5B8)] bg-white text-stone-700 hover:border-[var(--gold,#B8893F)]'
                  }`}
                >
                  {active && <Check size={11} />}
                  <span className="max-w-[160px] truncate">{d.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-stone-500">
            Sẽ tự tạo bộ <strong>“{DEFAULT_NOTE_DECK_TITLE}”</strong>
          </p>
        )}
      </div>

      {error && <p className="text-[11px] font-semibold text-rose-700">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-[var(--border,#E2D5B8)]/60 pt-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
        >
          Huỷ
        </button>
        <button
          type="button"
          disabled={
            saving ||
            !front.trim() ||
            !back.trim() ||
            (creatingNewDeck && !newDeckTitle.trim())
          }
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#7A1F24] px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 cursor-pointer"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          Lưu thẻ
        </button>
      </div>
    </div>
  );
}
