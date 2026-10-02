import axios from 'axios';

// Lấy base URL từ biến môi trường (mặc định là localhost:5000 nếu chưa set)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Token đang lưu trong localStorage, không cần cookie
});

// Thêm một Interceptor để gắn token vào header Authorization nếu có
api.interceptors.request.use(
  (config) => {
    // Trong môi trường Next.js (client side), lấy token từ localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
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

// Interceptor cho response để xử lý lỗi (ví dụ: token hết hạn, backend chưa chạy)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi Network Error khi backend offline (ECONNREFUSED)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn(
        '[API Gateway] Backend hiện chưa khởi động hoặc không thể kết nối tới http://localhost:5000. Hệ thống tự động chuyển sang chế độ dữ liệu offline (Mock Data).',
      );
      // Trả về response giả lập rỗng để component fallback sang default mock data mượt mà
      return Promise.resolve({ data: [] });
    }

    // Xử lý lỗi 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized! Token expired or invalid.');
      if (typeof window !== 'undefined') {
        // window.location.href = '/login';
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

