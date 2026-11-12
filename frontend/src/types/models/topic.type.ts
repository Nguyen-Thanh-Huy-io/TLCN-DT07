import { ContentStatus, DifficultyLevel } from '@/constants/enums';

/** Bài học rút gọn đi kèm từng chủ đề trong GET /topics/tree. */
export interface TopicLessonSummary {
  id: string;
  title?: string;
  name?: string;
  difficulty: DifficultyLevel;
  status: ContentStatus;
  displayOrder?: number;
  updatedAt?: string;
  thumbnailUrl?: string;
}

export interface TopicItem {
  id: string;
  parentId?: string | null;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: TopicItem[];
  lessons?: TopicLessonSummary[];
  lessonCount?: number;
  _count?: {
    lessons: number;
    children: number;
  };
  createdAt?: string;
  updatedAt?: string;
}
