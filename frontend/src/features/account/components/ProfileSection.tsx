'use client';

import { useState } from 'react';
import { BadgeCheck, MailWarning, Save } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { AccountApiService, type MyProfile } from '@/services/auth/account.service';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { HubButton } from '@/features/public-curriculum/components/hub/HubUi';
import { AccountCard, Notice, type NoticeState, FIELD_CLASS, FieldLabel } from './AccountUi';

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
    <div className="mt-5 rounded-xl border border-lh-gold/30 bg-lh-gold-soft p-4">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-lh-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-lh-ink">Email chưa được xác minh</p>
          <p className="mt-1 text-sm text-lh-muted">
            Bạn vẫn học bình thường; xác minh email giúp khôi phục tài khoản khi quên mật khẩu.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <HubButton variant="outline" onClick={send} disabled={sending}>
              {sending ? 'Đang gửi...' : 'Gửi mã xác minh'}
            </HubButton>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Mã 6 ký tự"
              maxLength={6}
              className={`${FIELD_CLASS} w-36 uppercase tracking-widest`}
            />
            <HubButton onClick={verify} disabled={code.trim().length !== 6}>
              Xác minh
            </HubButton>
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
      onChange(await AccountApiService.updateProfile(form));
      setNotice({ tone: 'ok', text: 'Đã lưu hồ sơ.' });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không lưu được hồ sơ.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountCard id="ho-so" eyebrow="Hồ sơ" title="Thông tin cá nhân">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
          <input id="username" value={profile.username} disabled className={`${FIELD_CLASS} opacity-70`} />
        </div>
        <div>
          <FieldLabel htmlFor="email">
            Email{' '}
            {profile.verified && <BadgeCheck className="inline size-4 text-lh-brand" aria-label="Đã xác minh" />}
          </FieldLabel>
          <input id="email" value={profile.email} disabled className={`${FIELD_CLASS} opacity-70`} />
        </div>
        <div>
          <FieldLabel htmlFor="lastName">Họ</FieldLabel>
          <input id="lastName" value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} className={FIELD_CLASS} />
        </div>
        <div>
          <FieldLabel htmlFor="firstName">Tên</FieldLabel>
          <input id="firstName" value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} className={FIELD_CLASS} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="avatarUrl">Ảnh đại diện (đường dẫn)</FieldLabel>
          <input
            id="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={(e) => set('avatarUrl')(e.target.value)}
            placeholder="https://..."
            className={FIELD_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="bio">Giới thiệu</FieldLabel>
          <textarea
            id="bio"
            rows={3}
            maxLength={500}
            value={form.bio}
            onChange={(e) => set('bio')(e.target.value)}
            placeholder="Bạn quan tâm giai đoạn lịch sử nào?"
            className={`${FIELD_CLASS} h-auto py-2.5`}
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <HubButton type="submit" disabled={saving}>
            <Save className="size-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </HubButton>
          <Notice notice={notice} />
        </div>
      </form>
      {!profile.verified && <EmailVerification profile={profile} onVerified={() => onChange({ ...profile, verified: true })} />}
    </AccountCard>
  );
}
