import axios from 'axios';
import { PublicAuthService } from './auth/public-auth.service';

// Lấy base URL từ biến môi trường (mặc định là localhost:5001 cho backend hiện tại)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Gắn access token của phiên đăng nhập hiện tại (dùng chung cho trang công khai và CMS).
// Không còn tự đăng nhập ngầm bằng tài khoản quản trị: quyền được quyết định theo người dùng thật.
api.interceptors.request.use((config) => {
  const token = PublicAuthService.getAccessToken();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

function redirectToLogin(): void {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/login')) return;
  const back = window.location.pathname + window.location.search;
  window.location.assign(`/login?redirect=${encodeURIComponent(back)}`);
}

export const API_ERROR_NETWORK_CODE = 'ERR_NETWORK';
export const API_NETWORK_ERROR_MESSAGE = 'Network Error';

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi Network Error khi backend offline (ECONNREFUSED)
    if (error.code === API_ERROR_NETWORK_CODE || error.message === API_NETWORK_ERROR_MESSAGE) {
      console.warn(
        `[API Gateway] Backend hiện chưa khởi động hoặc không thể kết nối tới ${API_URL}. Hệ thống tự động chuyển sang chế độ dữ liệu offline (Mock Data).`,
      );
      return Promise.resolve({ data: [] });
    }

    // 401: access token hết hạn → đổi refresh token rồi gửi lại 1 lần; không được thì về trang đăng nhập.
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await PublicAuthService.refresh();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      redirectToLogin();
    }

    return Promise.reject(error);
  },
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
