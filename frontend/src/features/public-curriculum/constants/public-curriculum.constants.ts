import { DifficultyLevel } from '@/constants/enums';

export enum LearningPathFilterType {
  ALL = 'ALL',
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  THEMATIC = 'THEMATIC',
}

export const PUBLIC_CURRICULUM_ROUTES = {
  CURRICULUM: '/chuong-trinh-hoc',
  LESSON_DETAIL: (slug: string, pathId?: string) =>
    pathId ? `/bai-hoc/${slug}?pathId=${encodeURIComponent(pathId)}` : `/bai-hoc/${slug}`,
} as const;

export const PATH_TYPE_META: Record<
  'CHRONOLOGICAL' | 'THEMATIC',
  { label: string; badgeBg: string; badgeText: string; badgeBorder: string; description: string }
> = {
  CHRONOLOGICAL: {
    label: 'Tiến trình lịch sử',
    badgeBg: 'bg-[#6e181b]/10',
    badgeText: 'text-[#6e181b]',
    badgeBorder: 'border-[#6e181b]/30',
    description: 'Học tuần tự theo dòng chảy niên biểu từ buổi đầu dựng nước đến hiện đại',
  },
  THEMATIC: {
    label: 'Chuyên đề chuyên sâu',
    badgeBg: 'bg-[#8a6828]/12',
    badgeText: 'text-[#8a6828]',
    badgeBorder: 'border-[#8a6828]/35',
    description: 'Khám phá theo từng chủ đề quân sự, văn hóa, ngoại giao và danh nhân',
  },
};

export const FILTER_TAB_OPTIONS: Array<{
  id: LearningPathFilterType;
  label: string;
}> = [
  { id: LearningPathFilterType.ALL, label: 'Tất cả lộ trình' },
  { id: LearningPathFilterType.CHRONOLOGICAL, label: 'Theo tiến trình lịch sử' },
  { id: LearningPathFilterType.THEMATIC, label: 'Theo chuyên đề' },
];

export const PUBLIC_DIFFICULTY_META: Record<
  DifficultyLevel | string,
  { label: string; className: string }
> = {
  [DifficultyLevel.EASY]: {
    label: 'Cơ bản',
    className: 'border-emerald-700/30 bg-emerald-900/10 text-emerald-900',
  },
  [DifficultyLevel.MEDIUM]: {
    label: 'Trung bình',
    className: 'border-amber-700/30 bg-amber-900/10 text-amber-900',
  },
  [DifficultyLevel.HARD]: {
    label: 'Chuyên sâu',
    className: 'border-[#6e181b]/30 bg-[#6e181b]/10 text-[#6e181b]',
  },
};

export const DEFAULT_COVER_IMAGES = [
  '/assets/hero.jpg',
  '/assets/citadel.jpg',
  '/assets/temple.jpg',
  '/assets/mountain.jpg',
] as const;
