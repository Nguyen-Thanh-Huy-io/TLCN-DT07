import { ContentStatus, LearningPathType } from '@/constants/enums';

export interface TopicItem {
  id: string;
  parentId?: string | null;
  name: string;
  description?: string;
  coverImageUrl?: string;
  pathType?: LearningPathType;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: TopicItem[];
  lessons?: any[];
  lessonCount?: number;
  _count?: {
    lessons: number;
    children: number;
  };
  createdAt?: string;
  updatedAt?: string;
}
