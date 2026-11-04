'use client';

import { EntityType } from '@/constants/enums';
import { ContentBlockEditor, type ContentSkeleton } from '../ContentBlockEditor';
import { type FigureProfileForm } from '../FigureProfileFields';
import { ENTITY_TYPE_LABELS } from '../entity-editor.constants';

/** Sườn bài gợi ý cho Tiểu sử nhân vật — xoá tiêu đề nào không có tư liệu, viết vào tiêu đề nào có. */
export const PERSON_CONTENT_SKELETONS: ContentSkeleton[] = [
  {
    label: '+ Chèn sườn bài Nhân vật',
    html: [
      '<h2>Xuất thân & thiếu thời</h2><p></p>',
      '<h2>Sự nghiệp & các mốc son</h2><p></p>',
      '<h2>Giai thoại lịch sử</h2><p></p>',
      '<h2>Di sản & tôn vinh</h2><p></p>',
    ].join(''),
  },
];

export interface EntityContentStepProps {
  type: EntityType;
  name?: string;
  tagline?: string;
  birthYear?: string | number | null;
  deathYear?: string | number | null;
  contentBlocks: unknown;
  onContentBlocksChange: (v: unknown) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  figureProfile: FigureProfileForm;
  onFigureProfileChange: (v: FigureProfileForm) => void;
  onPublish?: () => void;
}

/** Bước 2 — Nội dung & Tiểu sử: Tập trung 100% vào Studio Page Builder 3 cột. */
export function EntityContentStep({
  type,
  name,
  tagline,
  birthYear,
  deathYear,
  contentBlocks,
  onContentBlocksChange,
  onPublish,
}: EntityContentStepProps) {
  const yearsText =
    birthYear || deathYear ? `${birthYear || '?'} – ${deathYear || '?'}` : '';
  const subtitle = tagline
    ? yearsText
      ? `${tagline} · ${yearsText}`
      : tagline
    : yearsText || 'Bản ghi tri thức lịch sử chi tiết';

  return (
    <ContentBlockEditor
      value={contentBlocks}
      onChange={onContentBlocksChange}
      skeletons={type === EntityType.PERSON ? PERSON_CONTENT_SKELETONS : undefined}
      documentTitle={name?.trim() || 'Chưa đặt tên'}
      documentSubtitle={subtitle}
      entityCategory={ENTITY_TYPE_LABELS[type] || 'THỰC THỂ LỊCH SỬ'}
      onPublish={onPublish}
    />
  );
}
