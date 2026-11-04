import { ContentStatus, DifficultyLevel, MediaType } from '@/constants/enums';
import { LessonItem } from '@/types/models/lesson.type';
import { TagItem } from '@/types/models/tag.type';
import { TopicItem } from '@/types/models/topic.type';
import type { ContentRevisionItem } from '@/services/entities/content-revision.service';

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
  slug: string;
  setSlug: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
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
  status: ContentStatus | any;

  // Media Album
  mediaList: LessonMediaItem[];
  addMediaItem: (item: LessonMediaItem) => void;
  removeMediaItem: (index: number) => void;

  // Nội dung khối thật của bài học (chỉ có giá trị sau khi API trả dữ liệu ở chế độ sửa bài)
  initialBlockContent: any;

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
  submitLesson: (nextStatus: ContentStatus | any, overrideContent?: any) => Promise<void>;
  /** Bản sửa chờ duyệt đang mở của bài đang xuất bản (form đang hiện bản sửa này). */
  pendingRevision: ContentRevisionItem | null;
  revisionNotice: string | null;
  onRevisionChanged: (message: string) => void;
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

/** Chế độ hiển thị cột trái (Thêm khối | Mục lục) — đặt ở đây (không phải trong
 * LessonEditor.tsx) để tránh circular import với các component con dùng enum này. */
export enum LeftSidebarMode {
  BLOCKS = 'BLOCKS',
  OUTLINE = 'OUTLINE',
}

/** Tab của Panel Thuộc tính bên phải — lý do đặt ở đây giống trên. */
export enum SidebarTab {
  CLASSIFICATION = 'CLASSIFICATION',
  MEDIA = 'MEDIA',
  QUIZ = 'QUIZ',
  PUBLISHING = 'PUBLISHING',
}

