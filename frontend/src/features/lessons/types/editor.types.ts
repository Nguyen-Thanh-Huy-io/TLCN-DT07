import { DifficultyLevel, LessonStatus, MediaType } from '@/constants/enums';
import { LessonItem } from '@/types/models';
import { TagItem } from '@/types/models';
import { TopicItem } from '@/types/models';
import type { ContentRevisionItem } from '@/services/entities/content-revision.service';

export interface LessonMediaItem {
  id?: string;
  type: MediaType;
  url: string;
  caption?: string;
  displayOrder?: number;
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
  status: LessonStatus;

  // Media Album
  mediaList: LessonMediaItem[];
  addMediaItem: (item: LessonMediaItem) => void;
  removeMediaItem: (index: number) => void;

  // Nội dung khối thật của bài học (chỉ có giá trị sau khi API trả dữ liệu ở chế độ sửa bài)
  initialBlockContent: unknown;

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
  submitLesson: (nextStatus: LessonStatus, overrideContent?: unknown) => Promise<void>;
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
  BLOCK = 'BLOCK',
  CLASSIFICATION = 'CLASSIFICATION',
  MEDIA = 'MEDIA',
  PUBLISHING = 'PUBLISHING',
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
  sectionNumber?: string;
  children?: TocItem[];
}

export interface TopicOption {
  id: string;
  name: string;
  periodName?: string;
}

export interface LessonHeaderMetaData {
  title: string;
  slug?: string;
  description?: string;
  summary?: string;
  shortDescription?: string;
  topicId?: string;
  thumbnailUrl: string;
  difficulty?: DifficultyLevel;
  tags: string[];
}

export interface LessonHeaderMetaFormProps {
  data: LessonHeaderMetaData;
  onChange: <K extends keyof LessonHeaderMetaData>(field: K, value: LessonHeaderMetaData[K]) => void;
  topics?: TopicOption[];
  onOpenTopicPicker?: () => void;
  disabled?: boolean;
  className?: string;
}

export enum LessonBlockType {
  TEXT = 'TEXT',
  HEADING = 'HEADING',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  RESOURCE_LINK = 'RESOURCE_LINK',
  TIMELINE = 'TIMELINE',
  MAP = 'MAP',
  CHARACTER = 'CHARACTER',
  EVENT = 'EVENT',
  COMPARISON_TABLE = 'COMPARISON_TABLE',
  QUIZ = 'QUIZ',
  SECTION_ROW = 'SECTION_ROW',
  CALLOUT = 'CALLOUT',
  QUOTE = 'QUOTE',
  DIVIDER = 'DIVIDER',
  RELATED_PEOPLE = 'RELATED_PEOPLE',
  RELATED_EVENTS = 'RELATED_EVENTS',
  STORY_CHAPTER = 'STORY_CHAPTER',
}

export enum LessonBlockGroup {
  BASIC = 'BASIC',
  SPECIALIZED = 'SPECIALIZED',
  ADVANCED = 'ADVANCED',
}

export interface BlockPaletteItem {
  type: LessonBlockType;
  label: string;
  description: string;
  group: LessonBlockGroup;
}

export enum EntitySourceType {
  HISGO = 'HISGO',
  WIKIPEDIA = 'WIKIPEDIA',
}

export interface IEntitySearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  sourceType: EntitySourceType;
  rawKey?: string;
  wikidataId?: string;
}

export interface IEntityDetailPreview {
  name: string;
  years: string;
  summary: string;
  avatarUrl: string;
  tagline?: string;
  sourceUrl?: string;
  sourceType: EntitySourceType;
  entityId?: string;
  wikidataId?: string;
  birthDate?: string;
  deathDate?: string;
  occupation?: string;
  nationality?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  imageLicense?: string;
  imageArtist?: string;
}

export interface IWikipediaSearchResponse {
  pages?: Array<{
    id: number;
    key: string;
    title: string;
    excerpt?: string;
    description?: string;
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
  }>;
}

export interface IWikipediaSummaryResponse {
  type?: string;
  title: string;
  displaytitle?: string;
  description?: string;
  extract?: string;
  extract_html?: string;
  wikibase_item?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
}

export interface IWikidataClaimsResponse {
  entities?: Record<
    string,
    {
      id: string;
      claims?: Record<string, unknown[]>;
      labels?: Record<string, { value: string }>;
      descriptions?: Record<string, { value: string }>;
    }
  >;
}

