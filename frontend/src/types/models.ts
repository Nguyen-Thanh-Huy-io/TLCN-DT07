import { ContentStatus, DifficultyLevel, LessonStatus } from '@/constants/enums';

export interface TagItem {
  id: string;
  name: string;
  description?: string;
  _count?: { lessonTags: number; articleTags: number };
  colorHex?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  summary?: string | null; // Alias tương thích ngược
  content: unknown; // Cấu trúc JSON / JSONB
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
  topicId?: string | null;
  topic?: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
  } | null;
  tags?: TagItem[];
  lessonTags?: Array<{ tagId: string; tag?: TagItem }>;
  createdAt?: string;
  updatedAt?: string;
}

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

/**
 * Curriculum Node Type Enum (No magic strings)
 */
export enum CurriculumNodeType {
  TOPIC = 'TOPIC',
  LESSON = 'LESSON',
}

export interface QuizQuestionPreview {
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * Lesson node in Curriculum Tree (Level 3)
 */
export interface CurriculumLessonNode {
  id: string;
  type: CurriculumNodeType.LESSON;
  name: string;
  title?: string;
  topicId: string;
  difficulty: DifficultyLevel;
  xpReward?: number;
  status: ContentStatus;
  estimatedReadMinutes?: number;
  hasQuiz?: boolean;
  orderIndex: number;
  displayOrder?: number;
  updatedAt?: string;
  summary?: string;
  thumbnailUrl?: string;
  quizQuestions?: QuizQuestionPreview[];
  relatedEntities?: string[];
}

/**
 * Topic node in Curriculum Tree (Root or Subtopic)
 */
export interface CurriculumTopicNode {
  id: string;
  type: CurriculumNodeType.TOPIC;
  name: string;
  parentId?: string | null;
  description?: string;
  isSequential: boolean;
  status: ContentStatus;
  orderIndex: number;
  displayOrder?: number;
  subTopics?: CurriculumTopicNode[];
  children?: CurriculumTopicNode[];
  lessons: CurriculumLessonNode[];
  updatedAt?: string;
  _count?: {
    lessons: number;
    children: number;
  };
}

/**
 * Union type for any node in the hierarchy
 */
export type AnyCurriculumNode = CurriculumTopicNode | CurriculumLessonNode;
