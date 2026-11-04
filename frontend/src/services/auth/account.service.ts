import api from '../api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface MyProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  verified: boolean;
  provider: string;
  createdAt: string;
  userProfile: {
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface UpdateMyProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

const unwrap = <T>(body: unknown): T => {
  let current: unknown = body;
  for (let i = 0; i < 3; i += 1) {
    if (current && typeof current === 'object' && 'data' in current) current = (current as { data: unknown }).data;
    else break;
  }
  return current as T;
};

async function postPublic(path: string, payload: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return { ok: response.ok, message: message || '' };
  } catch {
    return { ok: false, message: 'Không thể kết nối tới máy chủ.' };
  }
}

/** Các thao tác trên tài khoản của chính người đang đăng nhập (trang /tai-khoan). */
export class AccountApiService {
  static async getProfile(): Promise<MyProfile> {
    const res = await api.get('/me/profile');
    return unwrap<MyProfile>(res.data);
  }

  static async updateProfile(payload: UpdateMyProfilePayload): Promise<MyProfile> {
    const res = await api.patch('/me/profile', payload);
    return unwrap<MyProfile>(res.data);
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/me/change-password', { currentPassword, newPassword });
  }

  static async logoutAllDevices(): Promise<void> {
    await api.post('/me/logout-all');
  }

  /** Gửi mã xác minh (6 ký tự) tới email. */
  static resendVerification(email: string) {
    return postPublic('/auth/resend-verification-email', { email });
  }

  static verifyEmail(email: string, code: string) {
    return postPublic('/auth/verify-email', { email, code });
  }
}
