import api from '@/services/api';
import { GUEST_ID_HEADER_NAME } from '@/constants/api-url';

// === note.types.ts ===
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

// === note.service.ts ===
const GUEST_ID_KEY = 'hisgo:guest-id';

/** Backend bọc mọi response qua TransformInterceptor: { statusCode, message, data }. */
interface ApiEnvelope<T> {
  data: T;
}

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest-default';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

/** Token đăng nhập do axios interceptor tự gắn; khách vãng lai được nhận diện qua guest id. */
function guestHeaders(): Record<string, string> {
  return { [GUEST_ID_HEADER_NAME]: getOrCreateGuestId() };
}

export async function fetchNotes(
  targetType: NoteTargetTypeValue,
  targetId: string
): Promise<NoteItem[]> {
  const res = await api.get<ApiEnvelope<NoteItem[]>>('/notes', {
    params: { targetType, targetId, guestId: getOrCreateGuestId() },
    headers: guestHeaders(),
  });
  return Array.isArray(res.data.data) ? res.data.data : [];
}

export async function createNoteApi(payload: CreateNotePayload): Promise<NoteItem> {
  const res = await api.post<ApiEnvelope<NoteItem>>(
    '/notes',
    { ...payload, guestId: getOrCreateGuestId() },
    { headers: guestHeaders() }
  );
  return res.data.data;
}

export async function updateNoteApi(id: string, payload: UpdateNotePayload): Promise<NoteItem> {
  const res = await api.patch<ApiEnvelope<NoteItem>>(`/notes/${id}`, payload, {
    headers: guestHeaders(),
  });
  return res.data.data;
}

export async function deleteNoteApi(id: string): Promise<void> {
  await api.delete(`/notes/${id}`, { headers: guestHeaders() });
}
