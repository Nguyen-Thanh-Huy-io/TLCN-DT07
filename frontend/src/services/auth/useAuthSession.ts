'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { PublicAuthService, SESSION_USER_STORAGE_KEY, type PublicAuthUser } from './public-auth.service';

function readUserRaw(): string | null {
  try {
    return window.localStorage.getItem(SESSION_USER_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Người dùng đang đăng nhập.
 *  - `undefined`: chưa biết (đang render ở server / lúc hydrate) — đừng chuyển hướng vội.
 *  - `null`: chắc chắn chưa đăng nhập.
 */
export function useAuthSession(): PublicAuthUser | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(
    (onChange) => PublicAuthService.subscribe(onChange),
    readUserRaw,
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined || raw === null) return raw;
    try {
      return JSON.parse(raw) as PublicAuthUser;
    } catch {
      return null;
    }
  }, [raw]);
}
