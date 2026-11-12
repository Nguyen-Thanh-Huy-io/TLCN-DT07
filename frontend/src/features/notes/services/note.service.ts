import api from '@/services/api';
import { GUEST_ID_HEADER_NAME } from '@/constants/api-url';
import {
  CreateNotePayload,
  NoteItem,
  NoteTargetTypeValue,
  UpdateNotePayload,
} from '../types/note.types';

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
