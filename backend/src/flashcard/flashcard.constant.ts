export const FLASHCARD_ROUTES = {
  ROOT: 'flashcards',
  DECKS: 'decks',
  DECK: 'decks/:deckId',
  DECK_CARDS: 'decks/:deckId/cards',
  DECK_DUE: 'decks/:deckId/due',
  CARD: 'cards/:cardId',
  CARD_REVIEW: 'cards/:cardId/review',
} as const;

export enum FlashcardRating {
  AGAIN = 'AGAIN',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export const FLASHCARD_LIMITS = {
  MAX_DECK_TITLE_LENGTH: 150,
  MAX_DECK_DESC_LENGTH: 400,
  MAX_CARD_SIDE_LENGTH: 4000,
  MAX_DECKS_PER_USER: 100,
  MAX_CARDS_PER_DECK: 500,
  DUE_BATCH_LIMIT: 50,
} as const;

export const SM2_DEFAULTS = {
  INITIAL_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  AGAIN_RETRY_MINUTES: 10,
} as const;

export const FLASHCARD_MESSAGES = {
  DECK_NOT_FOUND: 'Không tìm thấy bộ thẻ ghi nhớ này.',
  CARD_NOT_FOUND: 'Không tìm thấy thẻ ghi nhớ này.',
  TOO_MANY_DECKS: 'Bạn đã đạt giới hạn số bộ thẻ tối đa.',
  TOO_MANY_CARDS: 'Bộ thẻ này đã đạt giới hạn số thẻ tối đa.',
} as const;
