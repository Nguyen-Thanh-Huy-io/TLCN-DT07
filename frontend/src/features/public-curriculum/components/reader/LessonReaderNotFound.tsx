'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS } from '../hub/HubUi';
import { PUBLIC_CURRICULUM_ROUTES } from '../../constants/public-curriculum.constants';

export function LessonReaderNotFound({ error }: { error?: string | null }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-lh-red/30 bg-lh-red-soft p-10 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-red">
        Không tìm thấy bài học
      </h1>
      <p className="mt-2 text-sm text-lh-muted">
        {error || 'Bài học bạn yêu cầu không tồn tại hoặc đã bị gỡ.'}
      </p>
      <Link
        href={PUBLIC_CURRICULUM_ROUTES.CURRICULUM}
        className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary} mt-5`}
      >
        <ArrowLeft className="size-4" /> Về Chương trình học
      </Link>
    </div>
  );
}
