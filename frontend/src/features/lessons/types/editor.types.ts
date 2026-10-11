import { ContentStatus, DifficultyLevel, MediaType } from '@/constants/enums';
import { LessonItem } from '@/types/models/lesson.type';
import { TagItem } from '@/types/models/tag.type';
import { TopicItem } from '@/types/models/topic.type';

export interface LessonMediaItem {
  id?: string;
  type: MediaType;
  url: string;
  caption?: string;
  displayOrder?: number;
}

export interface LessonFormData {
  title: string;
  topicId: string;
  contentRichText: string;
  difficulty: DifficultyLevel;
  sourceReferenceNote: string;
  thumbnailUrl?: string;
  status: ContentStatus;
  media?: LessonMediaItem[];
}

export interface UseLessonEditorFacadeReturn {
  // Form State
  title: string;
  setTitle: (val: string) => void;
  selectedTopicId: string;
  setSelectedTopicId: (val: string) => void;
  contentRichText: string;
  setContentRichText: (val: string) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (val: DifficultyLevel) => void;
  sourceReferenceNote: string;
  setSourceReferenceNote: (val: string) => void;
  thumbnailUrl: string;
  setThumbnailUrl: (val: string) => void;
  displayOrder: number;
  setDisplayOrder: (val: number) => void;
  status: ContentStatus;

  // Media Album
  mediaList: LessonMediaItem[];
  addMediaItem: (item: LessonMediaItem) => void;
  removeMediaItem: (index: number) => void;

  // Metadata & Status
  topics: TopicItem[];
  topicLessons: LessonItem[];
  loadingTopicLessons: boolean;
  loadingLesson: boolean;
  saving: boolean;
  wordCount: number;
  estimatedReadMinutes: number;
  lessonId: string | null;

  // Auto-save Local Draft
  hasLocalDraft: boolean;
  lastSavedTime: string | null;
  lastSavedAt: Date | null;
  autoSaveState: AutoSaveState;
  restoreDraft: () => void;
  dismissDraft: () => void;

  // Tags
  selectedTags: TagItem[];
  setSelectedTags: (tags: TagItem[]) => void;

  // Actions
  submitLesson: (nextStatus: ContentStatus) => Promise<void>;
}

/** Trạng thái tự động lưu nháp cục bộ */
export enum AutoSaveState {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SAVED = 'SAVED',
  ERROR = 'ERROR',
  SYNCING = 'SYNCING',
}

/** Chế độ hiển thị của trình soạn thảo */
export enum EditorViewMode {
  EDIT = 'EDIT',
  SPLIT = 'SPLIT',
  PREVIEW = 'PREVIEW',
}

