import { ContentStatus, DifficultyLevel } from '@/constants/enums';

export interface LessonItem {
  id: string;
  topicId?: string;
  title: string;
  contentRichText?: string;
  difficulty: DifficultyLevel;
  xpReward?: number;
  estimatedReadMinutes?: number;
  displayOrder?: number;
  status: ContentStatus;
  rejectionReason?: string;
  sourceReferenceNote?: string;
  topic?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    username: string;
    fullName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
