export const FLASHCARD_API = {
  DECKS: '/flashcards/decks',
  DECKS_BATCH: '/flashcards/decks/batch',
  GENERATE_PREVIEW: '/flashcards/generate-preview',
  DECK: (deckId: string) => `/flashcards/decks/${deckId}`,
  DECK_CARDS: (deckId: string) => `/flashcards/decks/${deckId}/cards`,
  DECK_DUE: (deckId: string) => `/flashcards/decks/${deckId}/due`,
  CARD: (cardId: string) => `/flashcards/cards/${cardId}`,
  CARD_REVIEW: (cardId: string) => `/flashcards/cards/${cardId}/review`,
} as const;

export enum FlashcardRating {
  AGAIN = 'AGAIN',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export enum AiGeneratorEngine {
  GEMINI_FLASH = 'GEMINI_FLASH',
  HEURISTIC = 'HEURISTIC',
}

export const AI_CARD_COUNT_OPTIONS = [5, 10, 15, 20] as const;

export const AI_SUGGESTED_TOPICS = [
  'Chiến thắng Bạch Đằng năm 938',
  'Triều Trần & 3 lần kháng chiến chống Nguyên - Mông',
  'Khởi nghĩa Lam Sơn (1418–1427)',
  'Phong trào Tây Sơn & Quang Trung',
  'Cách mạng tháng Tám năm 1945',
  'Chiến dịch Điện Biên Phủ năm 1954',
] as const;

export const DEFAULT_NOTE_DECK_TITLE = 'Ghi chú ôn tập';
export const FLIP_KEY_CODE = 'Space';

export const RATING_OPTIONS: ReadonlyArray<{
  rating: FlashcardRating;
  label: string;
  hint: string;
  shortcut: string;
  buttonClass: string;
}> = [
  {
    rating: FlashcardRating.AGAIN,
    label: 'Quên',
    hint: '10 phút',
    shortcut: '1',
    buttonClass: 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100',
  },
  {
    rating: FlashcardRating.HARD,
    label: 'Khó',
    hint: 'Ngắn lại',
    shortcut: '2',
    buttonClass: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
  },
  {
    rating: FlashcardRating.GOOD,
    label: 'Nhớ',
    hint: 'Chuẩn SM-2',
    shortcut: '3',
    buttonClass: 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100',
  },
  {
    rating: FlashcardRating.EASY,
    label: 'Dễ',
    hint: 'Giãn dài',
    shortcut: '4',
    buttonClass: 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100',
  },
];
