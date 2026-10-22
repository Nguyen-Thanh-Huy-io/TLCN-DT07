'use client';

import { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { AccountApiService, type MyProfile } from '@/services/auth/account.service';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { HubButton } from '@/features/public-curriculum/components/hub/HubUi';
import { AccountCard, FIELD_CLASS, FieldLabel, Notice, type NoticeState } from './AccountUi';

// Khớp AuthUtilsService.validatePassword phía backend.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export function SecuritySection({ profile }: { profile: MyProfile }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const isLocal = profile.provider === 'local';

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!PASSWORD_RULE.test(next)) {
      setNotice({ tone: 'error', text: 'Mật khẩu mới cần ≥ 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.' });
      return;
    }
    if (next !== confirm) {
      setNotice({ tone: 'error', text: 'Mật khẩu nhập lại không khớp.' });
      return;
    }
    setSaving(true);
    try {
      await AccountApiService.changePassword(current, next);
      // Backend đã thu hồi mọi phiên — đăng nhập lại ngay bằng mật khẩu mới để giữ phiên hiện tại.
      const relogin = await PublicAuthService.login(profile.email, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setNotice({
        tone: 'ok',
        text: relogin.success
          ? 'Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.'
          : 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.',
      });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không đổi được mật khẩu.') });
    } finally {
      setSaving(false);
    }
  };

  const logoutAll = async () => {
    try {
      await AccountApiService.logoutAllDevices();
    } finally {
      await PublicAuthService.logout();
      window.location.assign('/login');
    }
  };

  return (
    <AccountCard id="bao-mat" eyebrow="Bảo mật" title="Mật khẩu & phiên đăng nhập">
      {isLocal ? (
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="current-password">Mật khẩu hiện tại</FieldLabel>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <FieldLabel htmlFor="new-password">Mật khẩu mới</FieldLabel>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <FieldLabel htmlFor="confirm-password">Nhập lại mật khẩu mới</FieldLabel>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div className="sm:col-span-3">
            <HubButton type="submit" disabled={saving}>
              <KeyRound className="size-4" /> {saving ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </HubButton>
            <Notice notice={notice} />
          </div>
        </form>
      ) : (
        <p className="text-sm text-lh-muted">
          Tài khoản đăng nhập bằng {profile.provider}; mật khẩu được quản lý ở nhà cung cấp đó.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-lh-line pt-5">
        <div>
          <p className="text-sm font-semibold text-lh-ink">Đăng xuất khỏi mọi thiết bị</p>
          <p className="text-sm text-lh-muted">Dùng khi bạn đăng nhập trên máy lạ hoặc nghi ngờ lộ mật khẩu.</p>
        </div>
        {confirmLogoutAll ? (
          <div className="flex gap-2">
            <HubButton variant="outline" onClick={logoutAll}>
              Xác nhận đăng xuất tất cả
            </HubButton>
            <HubButton variant="ghost" onClick={() => setConfirmLogoutAll(false)}>
              Không
            </HubButton>
          </div>
        ) : (
          <HubButton variant="outline" onClick={() => setConfirmLogoutAll(true)}>
            <LogOut className="size-4" /> Đăng xuất mọi thiết bị
          </HubButton>
        )}
      </div>
    </AccountCard>
  );
}
