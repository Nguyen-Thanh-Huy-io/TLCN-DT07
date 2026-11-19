import api from '@/services/api';
import {
  AiGeneratorEngine,
  FLASHCARD_API,
  FlashcardRating,
} from '../constants/flashcard.constants';

const unwrap = <T,>(res: { data: { data: T } }): T => res.data.data;

export interface FlashcardDeck {
  id: string;
  title: string;
  description: string | null;
  totalCards: number;
  dueCards: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardItem {
  id: string;
  deckId: string;
  front: string;
  back: string;
  sourceNoteId: string | null;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedCardDraft {
  front: string;
  back: string;
  sourceNoteId?: string;
}

export interface GeneratedFlashcardPreview {
  deckTitle: string;
  cards: GeneratedCardDraft[];
  engine: AiGeneratorEngine;
  noteCount: number;
  articleCount: number;
  wrongQuizCount: number;
}

export const FlashcardApiService = {
  async listDecks(): Promise<FlashcardDeck[]> {
    return unwrap(await api.get(FLASHCARD_API.DECKS));
  },
  async createDeck(input: { title: string; description?: string }): Promise<FlashcardDeck> {
    return unwrap(await api.post(FLASHCARD_API.DECKS, input));
  },
  async deleteDeck(deckId: string): Promise<void> {
    await api.delete(FLASHCARD_API.DECK(deckId));
  },
  async listCards(deckId: string): Promise<FlashcardItem[]> {
    return unwrap(await api.get(FLASHCARD_API.DECK_CARDS(deckId)));
  },
  async listDueCards(deckId: string): Promise<FlashcardItem[]> {
    return unwrap(await api.get(FLASHCARD_API.DECK_DUE(deckId)));
  },
  async createCard(
    deckId: string,
    input: { front: string; back: string; sourceNoteId?: string },
  ): Promise<FlashcardItem> {
    return unwrap(await api.post(FLASHCARD_API.DECK_CARDS(deckId), input));
  },
  async updateCard(
    cardId: string,
    input: { front?: string; back?: string },
  ): Promise<FlashcardItem> {
    return unwrap(await api.patch(FLASHCARD_API.CARD(cardId), input));
  },
  async deleteCard(cardId: string): Promise<void> {
    await api.delete(FLASHCARD_API.CARD(cardId));
  },
  async reviewCard(cardId: string, rating: FlashcardRating): Promise<FlashcardItem> {
    return unwrap(await api.post(FLASHCARD_API.CARD_REVIEW(cardId), { rating }));
  },
  async generatePreview(input: {
    articleIds?: string[];
    includeNotes?: boolean;
    includeWrongQuizzes?: boolean;
    maxCards?: number;
  }): Promise<GeneratedFlashcardPreview> {
    return unwrap(await api.post(FLASHCARD_API.GENERATE_PREVIEW, input));
  },
  async createDeckBatch(input: {
    title: string;
    cards: GeneratedCardDraft[];
  }): Promise<FlashcardDeck> {
    return unwrap(await api.post(FLASHCARD_API.DECKS_BATCH, input));
  },
};
