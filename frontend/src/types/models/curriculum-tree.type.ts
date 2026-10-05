import { ContentStatus, DifficultyLevel, LearningPathType } from '@/constants/enums';

/**
 * Curriculum Node Type Enum (No magic strings)
 */
export enum CurriculumNodeType {
  PERIOD = 'PERIOD',
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
  topicId: string;
  periodId?: string;
  difficulty: DifficultyLevel;
  xpReward: number;
  status: ContentStatus;
  estimatedReadMinutes?: number;
  hasQuiz?: boolean;
  orderIndex: number;
  updatedAt?: string;
  summary?: string;
  quizQuestions?: QuizQuestionPreview[];
  relatedEntities?: string[];
}

/**
 * Topic node in Curriculum Tree (Level 2)
 */
export interface CurriculumTopicNode {
  id: string;
  type: CurriculumNodeType.TOPIC;
  name: string;
  periodId?: string;
  pathType?: LearningPathType;
  description?: string;
  isSequential: boolean;
  status: ContentStatus;
  orderIndex: number;
  lessons: CurriculumLessonNode[];
  updatedAt?: string;
}

/**
 * Period node in Curriculum Tree (Level 1)
 */
export interface CurriculumPeriodNode {
  id: string;
  type: CurriculumNodeType.PERIOD;
  name: string;
  description?: string;
  region?: string;
  startYear?: number;
  endYear?: number;
  status: ContentStatus;
  orderIndex: number;
  topics: CurriculumTopicNode[];
  updatedAt?: string;
}

/**
 * Union type for any node in the hierarchy
 */
export type AnyCurriculumNode =
  | CurriculumPeriodNode
  | CurriculumTopicNode
  | CurriculumLessonNode;
