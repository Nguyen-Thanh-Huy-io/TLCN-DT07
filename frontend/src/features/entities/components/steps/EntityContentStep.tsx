'use client';

import { EntityType } from '@/constants/enums';
import { ContentBlockEditor } from '../ContentBlockEditor';
import { type FigureProfileForm } from '../FigureProfileFields';
import { EntityStrategyRegistry } from '../../strategies/entity-type.strategy';

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

/** Bước 2 — Nội dung chi tiết: Sử dụng Strategy Pattern để chèn đúng sườn bài và danh mục thực thể. */
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
  const strategy = EntityStrategyRegistry.get(type);
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
      skeletons={strategy.contentSkeletons}
      documentTitle={name?.trim() || 'Chưa đặt tên'}
      documentSubtitle={subtitle}
      entityCategory={strategy.label.toUpperCase()}
      onPublish={onPublish}
    />
  );
}
