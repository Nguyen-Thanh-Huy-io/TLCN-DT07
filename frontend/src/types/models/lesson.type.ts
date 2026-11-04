import { LessonStatus, DifficultyLevel } from '@/constants/enums';
import { TagItem } from './tag.type';

export interface LessonItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  summary?: string | null; // Alias tương thích ngược
  content: any; // Cấu trúc JSON / JSONB
  contentRichText?: string; // Alias tương thích ngược cho TipTap
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  displayOrder?: number;
  status: LessonStatus;
  rejectionReason?: string | null;
  publishedAt?: string | null;
  createdBy?: string;
  approvedBy?: string;
  estimatedReadMinutes?: number;
  tags?: TagItem[];
  lessonTags?: Array<{ tagId: string; tag?: TagItem }>;
  createdAt?: string;
  updatedAt?: string;
}
