'use client';
import { ContentStatus } from '@/constants/enums';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, Compass, X } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { LearningPathApiService, type LearningPathItem } from '@/services/entities/learning-path.service';
import { PUBLIC_CURRICULUM_ROUTES, DEFAULT_COVER_IMAGES } from '@/features/public-curriculum/constants/public-curriculum.constants';
import { pathLessons } from '@/features/public-curriculum/components/hub/HubSyllabus';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonProgress';
import { HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS, HubButton, HubProgress } from '@/features/public-curriculum/components/hub/HubUi';
import { AccountCard, Notice, type NoticeState } from './AccountUi';

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
                <img
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
