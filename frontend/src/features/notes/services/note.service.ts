import {
  CreateNotePayload,
  NoteItem,
  NoteTargetTypeValue,
  UpdateNotePayload,
} from '../types/note.types';

const GUEST_ID_KEY = 'hisgo:guest-id';

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest-default';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export async function fetchNotes(
  targetType: NoteTargetTypeValue,
  targetId: string
): Promise<NoteItem[]> {
  const guestId = getOrCreateGuestId();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    'x-guest-id': guestId,
  };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const query = new URLSearchParams({
    targetType,
    targetId,
    guestId,
  });

  const res = await fetch(`/api/notes?${query.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Lỗi tải ghi chú: ${res.status}`);
  }

  const result = await res.json();
  const data = result.data?.data || result.data || [];
  return Array.isArray(data) ? data : [];
}

export async function createNoteApi(
  payload: CreateNotePayload
): Promise<NoteItem> {
  const guestId = getOrCreateGuestId();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-guest-id': guestId,
  };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/notes', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, guestId }),
  });

  if (!res.ok) {
    throw new Error(`Lỗi tạo ghi chú: ${res.status}`);
  }

  const result = await res.json();
  return result.data?.data || result.data;
}

export async function updateNoteApi(
  id: string,
  payload: UpdateNotePayload
): Promise<NoteItem> {
  const guestId = getOrCreateGuestId();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-guest-id': guestId,
  };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/notes/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Lỗi cập nhật ghi chú: ${res.status}`);
  }

  const result = await res.json();
  return result.data?.data || result.data;
}

export async function deleteNoteApi(id: string): Promise<void> {
  const guestId = getOrCreateGuestId();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    'x-guest-id': guestId,
  };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Lỗi xoá ghi chú: ${res.status}`);
  }
}
