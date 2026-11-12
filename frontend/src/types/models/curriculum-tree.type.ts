import { ContentStatus, DifficultyLevel } from '@/constants/enums';

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
export type AnyCurriculumNode =
  | CurriculumTopicNode
  | CurriculumLessonNode;
