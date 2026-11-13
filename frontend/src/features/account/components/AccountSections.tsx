'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { NoticeTone, AuthProviderType, ContentStatus } from '@/constants/enums';
import { BadgeCheck, MailWarning, Save, KeyRound, LogOut, BookOpen, ChevronRight, Compass, X } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { AccountApiService, type MyProfile } from '@/services/auth/account.service';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { HubButton, pathLessons, HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS, HubProgress } from '@/features/public-curriculum/components/hub/HubReaderParts';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { LearningPathApiService, type LearningPathItem } from '@/services/entities/learning-path.service';
import { PUBLIC_CURRICULUM_ROUTES, DEFAULT_COVER_IMAGES } from '@/features/public-curriculum/constants/public-curriculum.constants';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonReaderHooks';
import { RemoteImage } from '@/components/common/RemoteImage';

// === AccountUi.tsx ===
export const FIELD_CLASS =
  'h-11 w-full rounded-xl border border-lh-line bg-lh-surface px-3.5 text-sm text-lh-ink outline-none transition focus:border-lh-brand/50 focus:ring-2 focus:ring-lh-brand/10';

export type NoticeState = { tone: NoticeTone | 'ok' | 'error'; text: string } | null;

export function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  return (
    <p role="status" className={`mt-2 text-sm ${notice.tone === NoticeTone.OK ? 'text-lh-brand' : 'text-lh-red'}`}>
      {notice.text}
    </p>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-lh-ink">
      {children}
    </label>
  );
}

export function AccountCard({
  id,
  eyebrow,
  title,
  action,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-lh-line bg-lh-surface p-5 shadow-lh-card sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-lh-brand">{eyebrow}</div>
          <h2 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// === ProfileSection.tsx ===
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
      const updated = await AccountApiService.updateProfile(form);
      onChange(updated);
      const fullName = [updated.userProfile?.lastName, updated.userProfile?.firstName].filter(Boolean).join(' ');
      PublicAuthService.updateCurrentUser({
        avatarUrl: updated.userProfile?.avatarUrl,
        displayName: fullName || updated.username,
      });
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

// === SecuritySection.tsx ===
// Khớp AuthUtilsService.validatePassword phía backend.
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
      router.replace(APP_ROUTES.LOGIN);
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

// === LearningSection.tsx ===
export function LearningSection() {
  const { enrolledPathIds, isCompleted, unenroll, completedIds, ready } = useLessonProgress();
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  useEffect(() => {
    LearningPathApiService.getLearningPaths()
      .then((all) => setPaths((Array.isArray(all) ? all : []).filter((p) => p.status === ContentStatus.PUBLISHED)))
      .catch(() => setPaths([]));
  }, []);

  const enrolled = paths.filter((p) => enrolledPathIds.includes(p.id));

  const leave = async (path: LearningPathItem) => {
    try {
      await unenroll(path.id);
      setConfirmId(null);
      setNotice({ tone: 'ok', text: `Đã hủy đăng ký "${path.title}". Tiến độ các bài đã học vẫn được giữ.` });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không hủy được đăng ký.') });
    }
  };

  return (
    <AccountCard
      id="hoc-tap"
      eyebrow="Học tập"
      title="Lộ trình của tôi"
      action={
        <span className="text-sm text-lh-muted">
          {enrolled.length} lộ trình · {completedIds.length} bài đã học
        </span>
      }
    >
      {!ready ? (
        <div className="h-32 animate-pulse rounded-xl bg-lh-surface-2" />
      ) : enrolled.length === 0 ? (
        <div className="rounded-xl border border-dashed border-lh-line p-8 text-center">
          <Compass className="mx-auto size-8 text-lh-muted" />
          <p className="mt-3 text-sm text-lh-muted">Bạn chưa đăng ký lộ trình nào.</p>
          <Link href={PUBLIC_CURRICULUM_ROUTES.CURRICULUM} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary} mt-4`}>
            Khám phá chương trình học <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrolled.map((path, index) => {
            const lessons = pathLessons(path);
            const done = lessons.filter((l) => isCompleted(l.id)).length;
            const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
            const next = lessons.find((l) => !isCompleted(l.id)) ?? lessons[0];
            return (
              <article key={path.id} className="grid gap-4 rounded-xl border border-lh-line p-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <RemoteImage
                  src={path.coverImageUrl || DEFAULT_COVER_IMAGES[index % DEFAULT_COVER_IMAGES.length]}
                  alt=""
                  className="aspect-video w-full rounded-lg object-cover sm:aspect-square"
                />
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold leading-snug text-lh-ink">{path.title}</h3>
                  <div className="mt-3 mb-2 flex justify-between text-xs">
                    <span className="font-semibold text-lh-ink">
                      <BookOpen className="mr-1 inline size-3.5" />
                      {done}/{lessons.length} bài
                    </span>
                    <span className="font-bold text-lh-brand">{percent}%</span>
                  </div>
                  <HubProgress value={percent} />
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {next && (
                      <Link
                        href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(next.slug, path.id)}
                        className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary}`}
                      >
                        {done === lessons.length ? 'Ôn lại' : done ? 'Học tiếp' : 'Bắt đầu học'} <ChevronRight className="size-4" />
                      </Link>
                    )}
                    {confirmId === path.id ? (
                      <>
                        <span className="text-sm text-lh-muted">Hủy đăng ký lộ trình này?</span>
                        <HubButton variant="outline" onClick={() => leave(path)}>
                          Xác nhận hủy
                        </HubButton>
                        <HubButton variant="ghost" onClick={() => setConfirmId(null)}>
                          Không
                        </HubButton>
                      </>
                    ) : (
                      <HubButton variant="ghost" onClick={() => setConfirmId(path.id)}>
                        <X className="size-4" /> Hủy đăng ký
                      </HubButton>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Notice notice={notice} />
    </AccountCard>
  );
}
