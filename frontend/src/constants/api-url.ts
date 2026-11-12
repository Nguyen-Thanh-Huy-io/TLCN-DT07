export const DEFAULT_BACKEND_URL = 'http://127.0.0.1:5000';

/**
 * Base URL dùng chung cho client/socket/fetch trực tiếp tới backend.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL
).replace(/\/+$/, '');

/**
 * Base URL cho SSR & Next.js Route Handlers (`src/app/api/**`),
 * ưu tiên IPv4 `127.0.0.1` để tránh lỗi phân giải `localhost` (IPv6 `::1`) trên Node.js.
 */
export const INTERNAL_API_BASE_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  DEFAULT_BACKEND_URL
)
  .replace(/\/+$/, '')
  .replace('://localhost', '://127.0.0.1');

export const AUTH_HEADER_NAME = 'authorization';
export const GUEST_ID_HEADER_NAME = 'x-guest-id';

/**
 * Chuẩn hóa URL ảnh/tài nguyên tải lên từ backend (hỗ trợ cả đường dẫn tương đối `/uploads/...`
 * hoặc URL tuyệt đối cũ chứa `localhost:5000` / `127.0.0.1:5000`).
 */
export function resolveBackendAssetUrl(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^data:/i.test(trimmed) || /^\/\//.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(
      /^http:\/\/(?:localhost|127\.0\.0\.1):500[01](?=\/)/,
      API_BASE_URL,
    );
  }

  return `${API_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}
