'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Layers, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { AccountCard } from '@/features/account/components/AccountSections';
import {
  FlashcardApiService,
  type FlashcardDeck,
  type FlashcardItem,
} from '../services/flashcard.service';
import { FlashcardDeckDetail } from './FlashcardDeckDetail';
import { FlashcardStudySession } from './FlashcardStudySession';

/** Tab "Thẻ ghi nhớ" trên trang /tai-khoan: quản lý bộ thẻ, tạo thẻ và ôn tập SM-2. */
export function FlashcardsSection({ onDueCountChange }: { onDueCountChange?: (due: number) => void }) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [creatingDeck, setCreatingDeck] = useState(false);

  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [deckCards, setDeckCards] = useState<FlashcardItem[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const [studying, setStudying] = useState<{ deck: FlashcardDeck; all: boolean } | null>(null);

  const reloadDecks = useCallback(async () => {
    try {
      const list = await FlashcardApiService.listDecks();
      setDecks(list);
      onDueCountChange?.(list.reduce((sum, d) => sum + d.dueCards, 0));
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được danh sách bộ thẻ.'));
    }
  }, [onDueCountChange]);

  useEffect(() => {
    let alive = true;
    FlashcardApiService.listDecks()
      .then((list) => {
        if (!alive) return;
        setDecks(list);
        onDueCountChange?.(list.reduce((sum, d) => sum + d.dueCards, 0));
      })
      .catch((err) => {
        if (alive) setError(extractErrorMessage(err, 'Không tải được danh sách bộ thẻ.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [onDueCountChange]);

  const openDeck = async (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    setLoadingCards(true);
    setError(null);
    try {
      setDeckCards(await FlashcardApiService.listCards(deck.id));
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được thẻ trong bộ này.'));
    } finally {
      setLoadingCards(false);
    }
  };

  const handleCreateDeck = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = newDeckTitle.trim();
    if (!title || creatingDeck) return;
    setCreatingDeck(true);
    setError(null);
    try {
      await FlashcardApiService.createDeck({ title });
      setNewDeckTitle('');
      await reloadDecks();
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tạo được bộ thẻ mới.'));
    } finally {
      setCreatingDeck(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm('Xoá bộ thẻ này và toàn bộ thẻ bên trong?')) return;
    try {
      await FlashcardApiService.deleteDeck(deckId);
      if (selectedDeck?.id === deckId) setSelectedDeck(null);
      await reloadDecks();
    } catch (err) {
      setError(extractErrorMessage(err, 'Không xoá được bộ thẻ.'));
    }
  };

  const totalDue = decks.reduce((sum, d) => sum + d.dueCards, 0);

  return (
    <AccountCard
      id="the-ghi-nho"
      icon={Layers}
      eyebrow="Ghi nhớ chủ động (SM-2)"
      title="Thẻ ghi nhớ ôn tập"
      action={
        <span className="rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 text-xs font-bold text-[var(--primary,#7A1F24)]">
          {totalDue} thẻ cần ôn hôm nay
        </span>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {studying ? (
        <FlashcardStudySession
          deck={studying.deck}
          studyAll={studying.all}
          onExit={() => {
            const current = studying.deck;
            setStudying(null);
            void reloadDecks();
            if (selectedDeck?.id === current.id) void openDeck(current);
          }}
        />
      ) : selectedDeck ? (
        <FlashcardDeckDetail
          deck={selectedDeck}
          cards={deckCards}
          loading={loadingCards}
          onBack={() => setSelectedDeck(null)}
          onStudyDue={() => setStudying({ deck: selectedDeck, all: false })}
          onStudyAll={() => setStudying({ deck: selectedDeck, all: true })}
          onCardsChange={async (next) => {
            setDeckCards(next);
            await reloadDecks();
          }}
          onError={setError}
        />
      ) : (
        <div className="space-y-5">
          <form onSubmit={(e) => void handleCreateDeck(e)} className="flex flex-wrap gap-2">
            <input
              type="text"
              required
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              placeholder="Tên bộ thẻ mới (VD: Các triều đại phong kiến, Sự kiện 1945–1975…)"
              maxLength={150}
              className="min-w-[220px] flex-1 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3.5 py-2 text-xs outline-none focus:border-[var(--gold,#B8893F)]"
            />
            <button
              type="submit"
              disabled={creatingDeck}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {creatingDeck ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Tạo bộ thẻ
            </button>
          </form>

          {loading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-[#EAE0CB]" />
          ) : decks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border,#E2D5B8)] bg-white/40 p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-page,#F5EEDC)] text-[var(--gold,#B8893F)]">
                <BookOpen size={26} />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)]">
                Chưa có bộ thẻ ghi nhớ nào
              </h3>
              <p className="mt-1 mx-auto max-w-md text-xs text-[var(--text-muted,#7A6B57)]">
                Tạo bộ thẻ mới ở trên, hoặc bấm <strong>Tạo thẻ</strong> ngay trên ghi chú khi đang đọc bài viết / bài học.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {decks.map((deck) => (
                <article
                  key={deck.id}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-4 transition hover:border-[var(--gold,#B8893F)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)]">
                        {deck.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => void handleDeleteDeck(deck.id)}
                        aria-label="Xoá bộ thẻ"
                        className="rounded p-1 text-[var(--text-muted,#7A6B57)] hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)]">
                      {deck.totalCards} thẻ ·{' '}
                      <span className={deck.dueCards > 0 ? 'font-bold text-[var(--primary,#7A1F24)]' : ''}>
                        {deck.dueCards} cần ôn
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-[var(--border,#E2D5B8)]/50 pt-3">
                    <button
                      type="button"
                      onClick={() => setStudying({ deck, all: false })}
                      disabled={deck.dueCards === 0}
                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-45 cursor-pointer"
                    >
                      <Play size={12} /> Ôn ngay ({deck.dueCards})
                    </button>
                    <button
                      type="button"
                      onClick={() => void openDeck(deck)}
                      className="rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/60 px-3 py-1.5 text-xs font-bold text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)] cursor-pointer"
                    >
                      Quản lý thẻ
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </AccountCard>
  );
}
