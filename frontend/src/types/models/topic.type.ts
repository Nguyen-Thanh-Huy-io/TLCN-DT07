import { ContentStatus } from '@/constants/enums';

export interface TopicItem {
  id: string;
  periodId?: string;
  name: string;
  description?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
  period?: {
    id: string;
    name: string;
  };
  lessonCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
