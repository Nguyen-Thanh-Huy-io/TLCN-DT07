const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Lưu trữ RIÊNG cho phiên đăng nhập của người đọc công khai — dùng key khác
 * với CMS (`access_token` trong `services/api.ts`) để không bị AuthSessionManager
 * của CMS (tự động đăng nhập ngầm bằng tài khoản admin khi 401) ghi đè hoặc xoá.
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'hisgo_reader_access_token',
  REFRESH_TOKEN: 'hisgo_reader_refresh_token',
  USER: 'hisgo_reader_user',
} as const;

export interface PublicAuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  verified: boolean;
}

export interface PublicAuthResult {
  success: boolean;
  message?: string;
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore in restricted environments
  }
}

function clearStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    window.localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    window.localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {
    // Ignore
  }
}

/** Gỡ 1-2 lớp bọc `{ message, data }` của TransformInterceptor phía backend. */
function unwrap(body: unknown): any {
  let current: any = body;
  for (let i = 0; i < 3; i += 1) {
    if (current && typeof current === 'object' && 'data' in current) {
      current = (current as { data: unknown }).data;
    } else {
      break;
    }
  }
  return current;
}

export const PublicAuthService = {
  getAccessToken(): string | null {
    return readStorage(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getCurrentUser(): PublicAuthUser | null {
    const raw = readStorage(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PublicAuthUser;
    } catch {
      return null;
    }
  },

  isLoggedIn(): boolean {
    return Boolean(this.getAccessToken() && this.getCurrentUser());
  },

  async login(email: string, password: string): Promise<PublicAuthResult> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (Array.isArray(body?.message) ? body.message.join(', ') : body?.message) ||
          'Email hoặc mật khẩu không đúng.';
        return { success: false, message };
      }

      const data = unwrap(body);
      if (!data?.accessToken || !data?.user) {
        return { success: false, message: 'Phản hồi không hợp lệ từ máy chủ.' };
      }

      writeStorage(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) {
        writeStorage(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      }
      writeStorage(STORAGE_KEYS.USER, JSON.stringify(data.user));

      return { success: true };
    } catch {
      return {
        success: false,
        message: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
      };
    }
  },

  async logout(): Promise<void> {
    const refreshToken = readStorage(STORAGE_KEYS.REFRESH_TOKEN);
    const user = this.getCurrentUser();
    clearStorage();

    if (!refreshToken || !user) return;
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, userId: user.id }),
      });
    } catch {
      // Đăng xuất phía client đã xong dù request thu hồi token thất bại
    }
  },
};
