import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PublicAuthService,
  SESSION_USER_STORAGE_KEY,
  USER_ROLE,
  isReviewerRole,
  isStaffRole,
  isSuperadminRole,
} from '@/services/auth/public-auth.service';
import { useAuthSession } from '@/services/auth/use-auth-session';

const MOCK_USER = {
  id: 'u-1',
  email: 'hocvien@hisgo.vn',
  username: 'hocvien',
  role: USER_ROLE.USER,
  verified: true,
};

describe('PublicAuthService & useAuthSession', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('kiểm tra phân quyền role helper với cả null/undefined', () => {
    expect(isStaffRole(USER_ROLE.USER)).toBe(false);
    expect(isStaffRole(USER_ROLE.MODERATOR)).toBe(true);
    expect(isReviewerRole(USER_ROLE.MODERATOR)).toBe(false);
    expect(isReviewerRole(USER_ROLE.ADMIN)).toBe(true);
    expect(isSuperadminRole(USER_ROLE.SUPERADMIN)).toBe(true);
    expect(isStaffRole(null)).toBe(false);
  });

  it('login thành công giải nén 2 lớp data, lưu token/user và kích hoạt useAuthSession', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        statusCode: 200,
        data: {
          data: {
            accessToken: 'acc-123',
            refreshToken: 'ref-456',
            user: MOCK_USER,
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuthSession());
    expect(result.current).toBeNull();

    let loginRes: { success: boolean; message?: string } = { success: false };
    await act(async () => {
      loginRes = await PublicAuthService.login('hocvien@hisgo.vn', 'Secret@123');
    });

    expect(loginRes).toEqual({ success: true });
    expect(PublicAuthService.isLoggedIn()).toBe(true);
    expect(PublicAuthService.getAccessToken()).toBe('acc-123');
    expect(result.current?.username).toBe('hocvien');

    act(() => {
      PublicAuthService.updateCurrentUser({ verified: false, displayName: 'Học Viên A' });
    });
    expect(result.current?.displayName).toBe('Học Viên A');
  });

  it('login trả về lỗi gọn khi server trả mảng message hoặc mất kết nối (ca âm)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: ['Sai mật khẩu', 'Tài khoản bị khoá'] }),
      }),
    );

    const failMsg = await PublicAuthService.login('a@b.c', 'wrong');
    expect(failMsg).toEqual({ success: false, message: 'Sai mật khẩu, Tài khoản bị khoá' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const netFail = await PublicAuthService.login('a@b.c', 'wrong');
    expect(netFail.success).toBe(false);
    expect(netFail.message).toContain('Không thể kết nối');
  });

  it('refresh gộp request đồng thời (single-flight) và xoá session khi refresh thất bại', async () => {
    window.localStorage.setItem('hisgo_reader_refresh_token', 'ref-1');
    window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(MOCK_USER));

    const fetchOk = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'new-acc', refreshToken: 'new-ref' } }),
    });
    vi.stubGlobal('fetch', fetchOk);

    const [t1, t2] = await Promise.all([PublicAuthService.refresh(), PublicAuthService.refresh()]);
    expect(t1).toBe('new-acc');
    expect(t2).toBe('new-acc');
    expect(fetchOk).toHaveBeenCalledTimes(1);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'revoked' }) }),
    );
    const expired = await PublicAuthService.refresh();
    expect(expired).toBeNull();
    expect(PublicAuthService.getCurrentUser()).toBeNull();
  });

  it('xử lý localStorage chứa JSON hỏng an toàn và logout thu hồi token', async () => {
    window.localStorage.setItem(SESSION_USER_STORAGE_KEY, '{invalid-json');
    expect(PublicAuthService.getCurrentUser()).toBeNull();

    const { result } = renderHook(() => useAuthSession());
    expect(result.current).toBeNull();

    window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(MOCK_USER));
    window.localStorage.setItem('hisgo_reader_refresh_token', 'ref-bye');
    const fetchLogout = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchLogout);

    await PublicAuthService.logout();
    expect(fetchLogout).toHaveBeenCalledTimes(1);
    expect(PublicAuthService.isLoggedIn()).toBe(false);
  });
});
