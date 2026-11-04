'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookmarkPlus, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import type { LearningPathItem } from '@/services/entities/learning-path.service';
import { type LessonAccess, LessonAccessState } from '../../facades/usePublicLessonReaderFacade';
import { DEFAULT_COVER_IMAGES } from '../../constants/public-curriculum.constants';
import { HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS, HubButton } from './HubUi';

interface LessonPreview {
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
}

/** Màn hình thay cho nội dung bài khi người đọc chưa đăng nhập hoặc chưa đăng ký lộ trình. */
export function HubLessonGate({
  access,
  preview,
  learningPath,
  onEnroll,
}: {
  access: Exclude<LessonAccess, 'GRANTED'>;
  preview: LessonPreview | null;
  learningPath: LearningPathItem | null;
  onEnroll: (pathId: string) => Promise<void>;
}) {
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const back = typeof window === 'undefined' ? '/chuong-trinh-hoc' : window.location.pathname + window.location.search;

  const handleEnroll = async () => {
    if (!learningPath) return;
    setEnrolling(true);
    setError(null);
    try {
      await onEnroll(learningPath.id);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể đăng ký lộ trình. Vui lòng thử lại.'));
      setEnrolling(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-lh-line bg-lh-surface shadow-lh-card">
      <div className="relative aspect-[2.6/1]">
        <img src={preview?.thumbnailUrl || DEFAULT_COVER_IMAGES[0]} alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-lh-surface via-lh-surface/40 to-transparent" />
        <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lh-surface text-lh-brand shadow-xl">
          <LockKeyhole className="size-7" />
        </span>
      </div>
      <div className="p-6 text-center sm:p-8">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-lh-gold">Bài học trong lộ trình</div>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-ink sm:text-3xl">
          {preview?.title ?? 'Bài học'}
        </h1>
        {preview?.description && <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-lh-muted">{preview.description}</p>}

        {access === LessonAccessState.LOGIN_REQUIRED ? (
          <>
            <p className="mx-auto mt-5 max-w-md text-sm text-lh-ink">
              Đăng nhập và đăng ký lộ trình (miễn phí) để đọc toàn bộ bài học, làm đề ôn tập và lưu tiến độ.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href={`/login?redirect=${encodeURIComponent(back)}`} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary}`}>
                <LogIn className="size-4" /> Đăng nhập
              </Link>
              <Link href={`/dang-ky?redirect=${encodeURIComponent(back)}`} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}>
                <UserPlus className="size-4" /> Tạo tài khoản
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mx-auto mt-5 max-w-md text-sm text-lh-ink">
              Bạn chưa đăng ký lộ trình
              {learningPath ? <strong> “{learningPath.title}”</strong> : ' chứa bài học này'}. Đăng ký miễn phí để bắt đầu học.
            </p>
            {learningPath && (
              <HubButton className="mt-5" onClick={handleEnroll} disabled={enrolling}>
                <BookmarkPlus className="size-4" /> {enrolling ? 'Đang đăng ký...' : 'Đăng ký lộ trình & vào học'}
              </HubButton>
            )}
          </>
        )}
        {error && <p className="mt-3 text-sm text-lh-red">{error}</p>}
      </div>
    </section>
  );
}
