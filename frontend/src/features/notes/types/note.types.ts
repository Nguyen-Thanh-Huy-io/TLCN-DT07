export const NOTE_TARGET_TYPE = {
  ARTICLE: 'ARTICLE',
  LESSON: 'LESSON',
} as const;

export type NoteTargetTypeValue =
  (typeof NOTE_TARGET_TYPE)[keyof typeof NOTE_TARGET_TYPE];

export const NOTE_COLOR = {
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
  BLUE: 'BLUE',
  PINK: 'PINK',
  PURPLE: 'PURPLE',
} as const;

export type NoteColorValue = (typeof NOTE_COLOR)[keyof typeof NOTE_COLOR];

export const NOTE_COLOR_STYLES: Record<
  NoteColorValue,
  { bg: string; border: string; text: string; badge: string; dot: string }
> = {
  YELLOW: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-400',
  },
  GREEN: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-400',
  },
  BLUE: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-900',
    badge: 'bg-sky-100 text-sky-800',
    dot: 'bg-sky-400',
  },
  PINK: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-400',
  },
  PURPLE: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-400',
  },
};

export interface NoteItem {
  id: string;
  targetType: NoteTargetTypeValue;
  targetId: string;
  userId: string | null;
  guestId: string | null;
  title: string | null;
  content: string;
  highlightText: string | null;
  color: NoteColorValue;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  } | null;
}

export interface CreateNotePayload {
  targetType: NoteTargetTypeValue;
  targetId: string;
  title?: string;
  content: string;
  highlightText?: string;
  color?: NoteColorValue;
  guestId?: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  highlightText?: string;
  color?: NoteColorValue;
}
