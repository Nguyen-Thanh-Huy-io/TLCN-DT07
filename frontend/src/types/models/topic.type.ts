import { ContentStatus, LearningPathType } from '@/constants/enums';

export interface TopicItem {
  id: string;
  periodId?: string | null;
  parentId?: string | null;
  name: string;
  description?: string;
  coverImageUrl?: string;
  pathType?: LearningPathType;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
  period?: {
    id: string;
    name: string;
    region?: string;
  } | null;
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
