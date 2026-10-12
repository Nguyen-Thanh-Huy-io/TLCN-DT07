import axios from 'axios';

// Lấy base URL từ biến môi trường (mặc định là localhost:5001 cho backend hiện tại)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Hằng số cấu hình tài khoản quản trị viên cho CMS
 */
export const CMS_ADMIN_CREDENTIALS = {
  EMAIL: 'admin@hisgo.edu.vn',
  PASSWORD: 'Admin@123456',
  STORAGE_KEY: 'access_token',
} as const;

/**
 * Trình quản lý phiên xác thực CMS (Singleton Pattern)
 * Hỗ trợ Silent Auto-Authentication và hàng đợi làm mới token chống race condition
 */
export class AuthSessionManager {
  private static loginPromise: Promise<string | null> | null = null;

  public static getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(CMS_ADMIN_CREDENTIALS.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  public static setStoredToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CMS_ADMIN_CREDENTIALS.STORAGE_KEY, token);
    } catch {
      // Ignore in restricted environments
    }
  }

  public static clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(CMS_ADMIN_CREDENTIALS.STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Đảm bảo luôn có Access Token hợp lệ trước khi gửi mutation requests
   */
  public static async ensureAccessToken(): Promise<string | null> {
    const existing = this.getStoredToken();
    if (existing) return existing;
    return this.refreshOrLogin();
  }

  /**
   * Tự động đăng nhập ngầm để lấy access token mới khi chưa có hoặc khi token hết hạn
   */
  public static async refreshOrLogin(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = (async () => {
      try {
        const response = await axios.post(
          `${API_URL}/auth/login`,
          {
            email: CMS_ADMIN_CREDENTIALS.EMAIL,
            password: CMS_ADMIN_CREDENTIALS.PASSWORD,
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
        );

        const data = response.data?.data?.data || response.data?.data || response.data;
        const accessToken = data?.accessToken || data?.tokens?.accessToken;

        if (accessToken) {
          this.setStoredToken(accessToken);
          return accessToken;
        }
        return null;
      } catch (err) {
        console.warn('[AuthSessionManager] Không thể tự động xác thực phiên quản trị viên:', err);
        return null;
      } finally {
        this.loginPromise = null;
      }
    })();

    return this.loginPromise;
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Thêm Request Interceptor: Tự động gắn Bearer Token và Silent Auto-Auth nếu cần
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      let token = AuthSessionManager.getStoredToken();
      const method = config.method?.toLowerCase() || 'get';

      // Với các request thay đổi dữ liệu (POST, PUT, PATCH, DELETE) nếu chưa có token -> tự động đăng nhập ngầm
      if (!token && ['post', 'put', 'patch', 'delete'].includes(method)) {
        token = await AuthSessionManager.ensureAccessToken();
      }

      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm Response Interceptor: Tự động retry khi gặp lỗi 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi Network Error khi backend offline (ECONNREFUSED)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn(
        `[API Gateway] Backend hiện chưa khởi động hoặc không thể kết nối tới ${API_URL}. Hệ thống tự động chuyển sang chế độ dữ liệu offline (Mock Data).`,
      );
      return Promise.resolve({ data: [] });
    }

    // Xử lý lỗi 401 Unauthorized: Tự động xóa token cũ, đăng nhập lấy token mới và retry lại 1 lần
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        AuthSessionManager.clearStoredToken();
        const newToken = await AuthSessionManager.refreshOrLogin();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'object' && error !== null) {
    const res = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    if (typeof res === 'string') return res;
    if (Array.isArray(res) && res.length > 0) return res.join(', ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function parsePaginatedResponse<T>(resData: unknown): PaginatedResult<T> {
  const dataObj =
    typeof resData === 'object' && resData !== null
      ? (resData as {
          data?: unknown;
          items?: unknown[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        })
      : {};
  const inner =
    typeof dataObj.data === 'object' && dataObj.data !== null
      ? (dataObj.data as {
          items?: unknown[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        })
      : dataObj;

  const items = Array.isArray(inner.items)
    ? (inner.items as T[])
    : Array.isArray(inner)
    ? (inner as T[])
    : [];

  return {
    items,
    total: inner.total ?? items.length,
    page: inner.page ?? 1,
    limit: inner.limit ?? items.length,
    totalPages: inner.totalPages ?? 1,
  };
}

export default api;
