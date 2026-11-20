import {
  Award,
  BookOpen,
  CalendarCheck,
  Flame,
  Layers,
  ScrollText,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export const ACHIEVEMENT_ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Flame,
  Award,
  CalendarCheck,
  BookOpen,
  Trophy,
  ScrollText,
  Layers,
};

export const ACHIEVEMENT_ICON_OPTIONS = [
  { key: 'Sparkles', label: 'Tia sáng' },
  { key: 'Flame', label: 'Ngọn lửa' },
  { key: 'Award', label: 'Huy chương' },
  { key: 'CalendarCheck', label: 'Đều đặn' },
  { key: 'BookOpen', label: 'Sách sử' },
  { key: 'Trophy', label: 'Cúp vàng' },
  { key: 'ScrollText', label: 'Sử liệu' },
  { key: 'Layers', label: 'Thẻ ghi nhớ' },
] as const;
