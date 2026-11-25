import api from '@/services/api';
import { GUEST_ID_HEADER_NAME } from '@/constants/api-url';
import {
  NOTE_ANCHOR_MODE,
  NOTE_COLOR,
  NOTE_INK_TOOL,
  NOTE_KIND,
  NOTE_MARKUP_STYLE,
  NOTE_TARGET_TYPE,
  type NoteAnchorModeValue,
  type NoteAnchorValue,
  type NoteColorValue,
  type NoteInkItem,
  type NoteItem,
  type NoteKindValue,
  type NoteMarkupStyleValue,
  type NoteTargetTypeValue,
} from '../utils/note-cluster.util';

export {
  NOTE_ANCHOR_MODE,
  NOTE_COLOR,
  NOTE_INK_TOOL,
  NOTE_KIND,
  NOTE_MARKUP_STYLE,
  NOTE_TARGET_TYPE,
  type NoteAnchorModeValue,
  type NoteAnchorValue,
  type NoteColorValue,
  type NoteInkItem,
  type NoteItem,
  type NoteKindValue,
  type NoteMarkupStyleValue,
  type NoteTargetTypeValue,
};

export const NOTE_COLOR_STYLES: Record<
  NoteColorValue,
  { bg: string; border: string; text: string; badge: string; dot: string; ink: string; stroke: string }
> = {
  YELLOW: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-400',
    ink: 'text-amber-700',
    stroke: '#D97706',
  },
  GREEN: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-400',
    ink: 'text-emerald-700',
    stroke: '#059669',
  },
  BLUE: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-900',
    badge: 'bg-sky-100 text-sky-800',
    dot: 'bg-sky-400',
    ink: 'text-blue-700',
    stroke: '#1D4ED8',
  },
  PINK: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-400',
    ink: 'text-rose-700',
    stroke: '#BE123C',
  },
  PURPLE: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-400',
    ink: 'text-purple-700',
    stroke: '#7C3AED',
  },
};

export interface CreateNotePayload {
  targetType: NoteTargetTypeValue;
  targetId: string;
  title?: string;
  /** Rỗng = chỉ tô màu đoạn `highlightText`. */
  content: string;
  highlightText?: string;
  anchor?: NoteAnchorValue;
  kind?: NoteKindValue;
  labels?: string[];
  color?: NoteColorValue;
  guestId?: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  highlightText?: string;
  color?: NoteColorValue;
  kind?: NoteKindValue;
  labels?: string[];
  /** Gắn lại vị trí (bài đã đổi); backend cập nhật phiên bản bài theo. */
  anchor?: NoteAnchorValue;
  /** Câu hỏi: true = đã hiểu. */
  resolved?: boolean;
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

/** Toàn bộ ghi chú của người học trên mọi bài viết và bài học (kèm tiêu đề + slug bài gốc). */
export async function fetchAllMyNotes(): Promise<NoteItem[]> {
  const res = await api.get<ApiEnvelope<NoteItem[]>>('/notes', {
    params: { guestId: getOrCreateGuestId() },
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

/** Nhãn người học đã dùng ở mọi bài, để gợi ý khi gõ. */
export async function fetchNoteLabels(): Promise<string[]> {
  const res = await api.get<ApiEnvelope<string[]>>('/notes/labels', {
    params: { guestId: getOrCreateGuestId() },
    headers: guestHeaders(),
  });
  return Array.isArray(res.data.data) ? res.data.data : [];
}

export async function deleteNoteApi(id: string): Promise<void> {
  await api.delete(`/notes/${id}`, { headers: guestHeaders() });
}
