'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  MailWarning,
  Save,
  KeyRound,
  LogOut,
  BookOpen,
  ChevronRight,
  Compass,
  X,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { NoticeTone, AuthProviderType, ContentStatus } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { AccountApiService, type MyProfile } from '@/services/auth/account.service';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { APP_ROUTES } from '@/constants/routes';
import { LearningPathApiService, type LearningPathItem } from '@/services/entities/learning-path.service';
import { PUBLIC_CURRICULUM_ROUTES, DEFAULT_COVER_IMAGES } from '@/features/public-curriculum/constants/public-curriculum.constants';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonReaderHooks';
import { pathLessons } from '@/features/public-curriculum/components/hub/HubReaderParts';
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
      setNotice({ tone: 'ok', text: `Đã hủy đăng ký lộ trình "${path.title}". Tiến độ học tập vẫn được bảo lưu an toàn.` });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không hủy được đăng ký.') });
    }
  };

  return (
    <AccountCard
      id="hoc-tap"
      eyebrow="Khóa học sử học"
      title="Lộ trình của tôi"
      action={
        <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 text-xs font-bold text-[var(--primary,#7A1F24)]">
          <Sparkles size={14} className="text-[var(--gold,#B8893F)]" />
          <span>{enrolled.length} lộ trình</span>
          <span>·</span>
          <span>{completedIds.length} bài hoàn thành</span>
        </div>
      }
    >
      {!ready ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[#EFE7D3]" />
      ) : enrolled.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border,#E2D5B8)] p-10 text-center bg-white/40">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-page,#F5EEDC)] text-[var(--gold,#B8893F)]">
            <Compass size={28} />
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)]">
            Chưa tham gia lộ trình lịch sử nào
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)] max-w-md mx-auto">
            Khám phá chương trình học theo triều đại và thời kỳ để bắt đầu hành trình khai phá di sản Đại Việt.
          </p>
          <Link
            href={PUBLIC_CURRICULUM_ROUTES.CURRICULUM}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition"
          >
            Khám phá chương trình học ngay <ChevronRight size={15} />
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
              <article
                key={path.id}
                className="group relative grid gap-4 rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-4 transition-all duration-200 hover:border-[var(--gold,#B8893F)] hover:shadow-md sm:grid-cols-[10rem_minmax(0,1fr)]"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <RemoteImage
                    src={path.coverImageUrl || DEFAULT_COVER_IMAGES[index % DEFAULT_COVER_IMAGES.length]}
                    alt=""
                    className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-full"
                  />
                  <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-[#F5EEDC] backdrop-blur-xs">
                    {percent}% Xong
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)] group-hover:text-[var(--primary,#7A1F24)] transition-colors">
                      {path.title}
                    </h3>
                    <div className="mt-3 mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-muted,#7A6B57)] flex items-center gap-1">
                        <BookOpen size={13} className="text-[var(--gold,#B8893F)]" />
                        {done} / {lessons.length} bài đã hoàn tất
                      </span>
                      <span className="font-extrabold text-[var(--primary,#7A1F24)]">{percent}%</span>
                    </div>
                    {/* Progress Bar Vàng kim */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAE0CB]">
                      <div
                        className="h-full bg-gradient-to-r from-[#B8893F] to-[#7A1F24] transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border,#E2D5B8)]/40 pt-3">
                    {next && (
                      <Link
                        href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(next.slug, path.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
                      >
                        {done === lessons.length ? 'Ôn tập lại' : done ? 'Tiếp tục bài học' : 'Bắt đầu học'}
                        <ChevronRight size={14} />
                      </Link>
                    )}
                    {confirmId === path.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--primary,#7A1F24)] font-semibold">Hủy lộ trình?</span>
                        <button
                          type="button"
                          onClick={() => leave(path)}
                          className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                        >
                          Xác nhận
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200 transition"
                        >
                          Không
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(path.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted,#7A6B57)] hover:text-red-700 transition"
                      >
                        <X size={13} /> Hủy đăng ký
                      </button>
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

/* ==========================================================================
   3. TƯ LIỆU ĐÃ LƯU (SAVED BOOKMARKS SECTION)
   ========================================================================== */
export function SavedBookmarksSection() {
  const [savedArticles] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('hisgo:saved-articles');
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });

  const [savedTimeline] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('hisgo.saved');
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });

  const totalSaved = savedArticles.length + savedTimeline.length;

  return (
    <AccountCard
      id="tu-lieu"
      icon={Bookmark}
      eyebrow="Tủ sách cá nhân"
      title="Tư liệu & Dấu mốc đã lưu"
      action={
        <span className="text-xs font-bold text-[var(--gold,#B8893F)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 rounded-xl border border-[var(--border,#E2D5B8)]">
          {totalSaved} mục đã ghim
        </span>
      }
    >
      {totalSaved === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border,#E2D5B8)] p-10 text-center bg-white/40">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-page,#F5EEDC)] text-[var(--gold,#B8893F)]">
            <Bookmark size={26} />
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)]">
            Chưa lưu tư liệu nào
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)] max-w-md mx-auto">
            Khi đọc bài viết hoặc khám phá Dòng thời gian, bấm nút Lưu trên thanh công cụ để đưa tư liệu quý vào tủ sách của bạn.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/dong-thoi-gian"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
            >
              Khám phá Dòng thời gian <ExternalLink size={13} />
            </Link>
            <Link
              href="/bai-viet"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-4 py-2 text-xs font-bold text-[var(--primary,#7A1F24)] hover:bg-[#F5EEDC] transition"
            >
              Kho tư liệu bài viết <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)] flex items-center gap-2">
                <Bookmark size={16} className="text-[var(--gold,#B8893F)]" />
                Dấu mốc & Sự kiện đã lưu ({savedTimeline.length})
              </h4>
              <Link href="/dong-thoi-gian" className="text-xs font-bold text-[var(--primary,#7A1F24)] hover:underline flex items-center gap-1">
                Xem trên dòng thời gian <ChevronRight size={13} />
              </Link>
            </div>
            {savedTimeline.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedTimeline.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 text-xs font-semibold text-[var(--primary,#7A1F24)]"
                  >
                    <span>Mục #{id.slice(0, 8)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted,#7A6B57)]">Chưa có sự kiện dòng thời gian nào.</p>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)] flex items-center gap-2">
                <BookOpen size={16} className="text-[var(--primary,#7A1F24)]" />
                Bài viết & Chuyên đề đã lưu ({savedArticles.length})
              </h4>
              <Link href="/bai-viet" className="text-xs font-bold text-[var(--primary,#7A1F24)] hover:underline flex items-center gap-1">
                Mở kho bài viết <ChevronRight size={13} />
              </Link>
            </div>
            {savedArticles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedArticles.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 text-xs font-semibold text-[var(--primary,#7A1F24)]"
                  >
                    <span>Bài viết #{id.slice(0, 8)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted,#7A6B57)]">Chưa có bài viết nào được lưu.</p>
            )}
          </div>
        </div>
      )}
    </AccountCard>
  );
}

/* ==========================================================================
   4. BẢO MẬT & PHIÊN ĐĂNG NHẬP (SECURITY SECTION)
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
