export enum QuickSettingKey {
  EVENT_INFO = 'EVENT_INFO',
  CHARACTERS = 'CHARACTERS',
  LOCATIONS = 'LOCATIONS',
  TIMELINE = 'TIMELINE',
  MEDIA_DOCS = 'MEDIA_DOCS',
  QUESTIONS = 'QUESTIONS',
}

export interface QuickSettingItem {
  key: QuickSettingKey;
  label: string;
  iconName: string;
  description?: string;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
  sectionNumber?: string;
  children?: TocItem[];
}

export enum LessonCategoryType {
  EVENT = 'EVENT',
  CHARACTER = 'CHARACTER',
  LOCATION = 'LOCATION',
  TOPIC = 'TOPIC',
}

export interface LessonTypeConfig {
  type: LessonCategoryType;
  label: string;
  badgeTone: 'blue' | 'amber' | 'emerald' | 'purple';
  guidanceText: string;
}

export interface LessonLeftSidebarProps {
  lessonTitle: string;
  lessonType?: LessonCategoryType;
  tocItems: TocItem[];
  activeHeadingId?: string;
  onSelectHeading: (headingId: string) => void;
  onAddHeading?: () => void;
  onQuickJump: (key: QuickSettingKey) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
