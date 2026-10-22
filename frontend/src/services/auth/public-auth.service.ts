const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Phiên đăng nhập duy nhất của ứng dụng — dùng chung cho trang công khai (người học)
 * và CMS (biên tập viên / người duyệt / superadmin). `services/api.ts` đọc token từ đây.
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'hisgo_reader_access_token',
  REFRESH_TOKEN: 'hisgo_reader_refresh_token',
  USER: 'hisgo_reader_user',
} as const;

export const SESSION_USER_STORAGE_KEY = STORAGE_KEYS.USER;

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

/** Vai trò (enum userRole phía backend) và nhãn hiển thị. */
export const USER_ROLE = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  USER: 'Người học',
  MODERATOR: 'Biên tập viên',
  ADMIN: 'Người duyệt',
  SUPERADMIN: 'Quản trị hệ thống',
};

const STAFF_ROLES: string[] = [USER_ROLE.MODERATOR, USER_ROLE.ADMIN, USER_ROLE.SUPERADMIN];
const REVIEWER_ROLES: string[] = [USER_ROLE.ADMIN, USER_ROLE.SUPERADMIN];

export const isStaffRole = (role?: string | null) => Boolean(role && STAFF_ROLES.includes(role));
export const isReviewerRole = (role?: string | null) => Boolean(role && REVIEWER_ROLES.includes(role));
export const isSuperadminRole = (role?: string | null) => role === USER_ROLE.SUPERADMIN;

const SESSION_EVENT = 'hisgo:session-changed';

function notifySessionChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EVENT));
}

let refreshPromise: Promise<string | null> | null = null;

export const PublicAuthService = {
  /** Gọi lại `onChange` khi đăng nhập/đăng xuất (cả ở tab khác). Trả về hàm hủy đăng ký. */
  subscribe(onChange: () => void): () => void {
    window.addEventListener(SESSION_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(SESSION_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  },

  getAccessToken(): string | null {
    return readStorage(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /** Đổi refresh token lấy access token mới; dùng chung 1 request khi nhiều lời gọi 401 cùng lúc. */
  refresh(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const refreshToken = readStorage(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return null;
      try {
        const response = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const data = unwrap(await response.json().catch(() => null));
        if (!response.ok || !data?.accessToken) {
          clearStorage();
          notifySessionChanged();
          return null;
        }
        writeStorage(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        if (data.refreshToken) writeStorage(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  },

  async register(payload: { username: string; email: string; password: string }): Promise<PublicAuthResult> {
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (Array.isArray(body?.message) ? body.message.join(', ') : body?.message) ||
          'Không thể tạo tài khoản. Vui lòng thử lại.';
        return { success: false, message };
      }
      return { success: true };
    } catch {
      return { success: false, message: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.' };
    }
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
      notifySessionChanged();

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
    notifySessionChanged();

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
