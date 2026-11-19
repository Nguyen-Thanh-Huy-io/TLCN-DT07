'use client';

import React, { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, MailWarning, Save, KeyRound, LogOut, BookOpen, ShieldCheck } from 'lucide-react';
import { NoticeTone, AuthProviderType } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { AccountApiService, type MyProfile } from '@/services/auth/account.service';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { APP_ROUTES } from '@/constants/routes';
import { RemoteImage } from '@/components/common/RemoteImage';

export const FIELD_CLASS =
  'h-11 w-full rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] px-4 text-sm text-[var(--text-body,#2D1A10)] outline-none transition focus:border-[var(--gold,#B8893F)] focus:ring-2 focus:ring-[var(--gold,#B8893F)]/15';

export type NoticeState = { tone: NoticeTone | 'ok' | 'error' | 'success'; text: string } | null;

const SUCCESS_TONE_VALUES: ReadonlySet<string> = new Set([NoticeTone.OK, NoticeTone.SUCCESS, 'ok', 'success']);

export function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  const isOk = SUCCESS_TONE_VALUES.has(notice.tone);
  return (
    <div
      role="status"
      className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold ${
        isOk
          ? 'bg-[#EBF5EA] text-[#24632B] border border-[#C5E3C0]'
          : 'bg-[#FDF0EE] text-[#9E2A2B] border border-[#F5C7C3]'
      }`}
    >
      {notice.text}
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted,#7A6B57)]">
      {children}
    </label>
  );
}

export function AccountCard({
  id,
  icon: Icon,
  eyebrow,
  title,
  action,
  children,
}: {
  id: string;
  icon?: typeof BookOpen;
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-surface,#FAF6EA)] p-6 shadow-sm transition hover:shadow-md sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border,#E2D5B8)]/60 pb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#F5EEDC] to-[#EAE0CB] border border-[var(--border,#E2D5B8)] text-[var(--primary,#7A1F24)] shadow-xs">
              <Icon size={20} />
            </div>
          )}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold,#B8893F)]">{eyebrow}</span>
            <h2 className="font-[family-name:var(--font-heading)] text-xl sm:text-2xl font-bold text-[var(--text-body,#2D1A10)]">
              {title}
            </h2>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ==========================================================================
   1. HỒ SƠ CÁ NHÂN (PROFILE SECTION)
   ========================================================================== */
function EmailVerification({ profile, onVerified }: { profile: MyProfile; onVerified: () => void }) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const send = async () => {
    setSending(true);
    const res = await AccountApiService.resendVerification(profile.email);
    setSending(false);
    setNotice(
      res.ok
        ? { tone: 'ok', text: `Đã gửi mã xác minh tới ${profile.email}.` }
        : { tone: 'error', text: res.message || 'Không gửi được mã xác minh.' },
    );
  };

  const verify = async () => {
    const res = await AccountApiService.verifyEmail(profile.email, code.trim());
    if (!res.ok) {
      setNotice({ tone: 'error', text: res.message || 'Mã xác minh không đúng hoặc đã hết hạn.' });
      return;
    }
    PublicAuthService.updateCurrentUser({ verified: true });
    onVerified();
  };

  return (
    <div className="mt-6 rounded-2xl border border-[var(--gold,#B8893F)]/30 bg-[#FFFBF2] p-5 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--gold,#B8893F)]/15 text-[var(--gold,#B8893F)]">
          <MailWarning size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-[var(--text-body,#2D1A10)]">Email chưa được đóng Kim Ấn (Xác minh)</h4>
          <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)] leading-relaxed">
            Xác minh email để bảo toàn tiến độ sử học và dễ dàng khôi phục tài khoản khi cần thiết.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3.5 text-xs font-semibold text-[var(--primary,#7A1F24)] hover:bg-[#F5EEDC] transition"
            >
              {sending ? 'Đang gửi...' : 'Gửi mã xác minh'}
            </button>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MÃ 6 KÝ TỰ"
              maxLength={6}
              className="h-9 w-32 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--text-body,#2D1A10)] outline-none focus:border-[var(--gold,#B8893F)]"
            />
            <button
              type="button"
              onClick={verify}
              disabled={code.trim().length !== 6}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#C99C48] to-[#B8893F] px-4 text-xs font-bold text-[#3D0A0E] shadow-xs hover:brightness-105 transition disabled:opacity-50"
            >
              Xác minh
            </button>
          </div>
          <Notice notice={notice} />
        </div>
      </div>
    </div>
  );
}

export function ProfileSection({ profile, onChange }: { profile: MyProfile; onChange: (p: MyProfile) => void }) {
  const [form, setForm] = useState({
    lastName: profile.userProfile?.lastName ?? '',
    firstName: profile.userProfile?.firstName ?? '',
    bio: profile.userProfile?.bio ?? '',
    avatarUrl: profile.userProfile?.avatarUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await AccountApiService.updateProfile(form);
      onChange(updated);
      const fullName = [updated.userProfile?.lastName, updated.userProfile?.firstName].filter(Boolean).join(' ');
      PublicAuthService.updateCurrentUser({
        avatarUrl: updated.userProfile?.avatarUrl,
        displayName: fullName || updated.username,
      });
      setNotice({ tone: 'ok', text: 'Hồ sơ học giả đã được cập nhật thành công!' });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không lưu được hồ sơ.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountCard id="ho-so" eyebrow="Thông tin định danh" title="Hồ sơ sử học">
      <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="username">Tên người dùng (Tài khoản)</FieldLabel>
          <input id="username" value={profile.username} disabled className={`${FIELD_CLASS} opacity-60 cursor-not-allowed`} />
        </div>
        <div>
          <FieldLabel htmlFor="email">
            Địa chỉ thư điện tử (Email){' '}
            {profile.verified && <BadgeCheck className="inline size-4 text-emerald-600" aria-label="Đã xác minh" />}
          </FieldLabel>
          <input id="email" value={profile.email} disabled className={`${FIELD_CLASS} opacity-60 cursor-not-allowed`} />
        </div>
        <div>
          <FieldLabel htmlFor="lastName">Họ và tên đệm</FieldLabel>
          <input id="lastName" value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} placeholder="Ví dụ: Nguyễn Văn" className={FIELD_CLASS} />
        </div>
        <div>
          <FieldLabel htmlFor="firstName">Tên</FieldLabel>
          <input id="firstName" value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} placeholder="Ví dụ: An" className={FIELD_CLASS} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="avatarUrl">Đường dẫn ảnh đại diện (Avatar URL)</FieldLabel>
          <div className="flex gap-3 items-center">
            <input
              id="avatarUrl"
              type="url"
              value={form.avatarUrl}
              onChange={(e) => set('avatarUrl')(e.target.value)}
              placeholder="https://..."
              className={FIELD_CLASS}
            />
            {form.avatarUrl && (
              <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-[var(--gold,#B8893F)]">
                <RemoteImage src={form.avatarUrl} alt="" className="size-full object-cover" />
              </div>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="bio">Lời tự bạch (Giới thiệu bản thân & Mối quan tâm lịch sử)</FieldLabel>
          <textarea
            id="bio"
            rows={3}
            maxLength={500}
            value={form.bio}
            onChange={(e) => set('bio')(e.target.value)}
            placeholder="Bạn đặc biệt yêu thích triều đại, trận đánh hoặc nhân vật lịch sử nào?"
            className={`${FIELD_CLASS} h-auto py-3 leading-relaxed`}
          />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-6 text-sm font-bold text-white shadow-sm hover:brightness-110 transition disabled:opacity-60"
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}
          </button>
          <Notice notice={notice} />
        </div>
      </form>
      {!profile.verified && <EmailVerification profile={profile} onVerified={() => onChange({ ...profile, verified: true })} />}
    </AccountCard>
  );
}

/* ==========================================================================
   2. LỘ TRÌNH HỌC TẬP (LEARNING SECTION)
   ========================================================================== */
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export function SecuritySection({ profile }: { profile: MyProfile }) {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const isLocal = profile.provider === AuthProviderType.LOCAL;

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!PASSWORD_RULE.test(next)) {
      setNotice({ tone: 'error', text: 'Mật khẩu mới cần ≥ 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.' });
      return;
    }
    if (next !== confirm) {
      setNotice({ tone: 'error', text: 'Mật khẩu nhập lại không trùng khớp.' });
      return;
    }
    setSaving(true);
    try {
      await AccountApiService.changePassword(current, next);
      const relogin = await PublicAuthService.login(profile.email, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setNotice({
        tone: 'ok',
        text: relogin.success
          ? 'Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất an toàn.'
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
      router.replace(APP_ROUTES.LOGIN);
    }
  };

  return (
    <AccountCard id="bao-mat" icon={ShieldCheck} eyebrow="An toàn tài khoản" title="Bảo mật & Phiên đăng nhập">
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
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-6 text-sm font-bold text-white shadow-sm hover:brightness-110 transition disabled:opacity-60"
            >
              <KeyRound size={16} /> {saving ? 'Đang cập nhật...' : 'Đổi mật khẩu tài khoản'}
            </button>
            <Notice notice={notice} />
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-4">
          <p className="text-xs text-[var(--text-muted,#7A6B57)] leading-relaxed">
            Tài khoản này được bảo hộ thông qua liên kết ủy quyền <strong>{profile.provider}</strong>. Mật khẩu được quản lý trực tiếp tại cổng xác thực đó.
          </p>
        </div>
      )}

      {/* Logout All Devices Panel */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border,#E2D5B8)]/60 pt-6">
        <div>
          <h4 className="text-sm font-bold text-[var(--text-body,#2D1A10)]">Đăng xuất khỏi tất cả thiết bị</h4>
          <p className="text-xs text-[var(--text-muted,#7A6B57)] mt-0.5">
            Hủy quyền truy cập tức thời trên mọi máy tính và điện thoại đã lưu đăng nhập trước đây.
          </p>
        </div>
        {confirmLogoutAll ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={logoutAll}
              className="rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-800 transition"
            >
              Xác nhận đăng xuất tất cả
            </button>
            <button
              type="button"
              onClick={() => setConfirmLogoutAll(false)}
              className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-body,#2D1A10)] hover:bg-[#F5EEDC] transition"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmLogoutAll(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
          >
            <LogOut size={14} /> Đăng xuất mọi thiết bị
          </button>
        )}
      </div>
    </AccountCard>
  );
}
