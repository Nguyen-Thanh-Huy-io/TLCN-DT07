import { DifficultyLevel, ContentStatus, MediaType } from '@/constants/enums';
import type { LessonItem, TagItem, TopicItem } from '@/types/models';
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
  status: ContentStatus;

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
  submitLesson: (nextStatus: ContentStatus, overrideContent?: unknown) => Promise<void>;
  /** Lỗi validation / lưu bài học hiển thị inline (thay cho window.alert). */
  formError: string | null;
  clearFormError: () => void;
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

/** Tab chính cấp 1 của trình soạn bài học (tách Thông tin/Hồ sơ khỏi không gian soạn CMS). */
export enum LessonEditorMainTab {
  INFO = 'INFO',
  CMS = 'CMS',
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
  COMPARISON_TABLE = 'COMPARISON_TABLE',
  QUIZ = 'QUIZ',
  SECTION_ROW = 'SECTION_ROW',
  CALLOUT = 'CALLOUT',
  QUOTE = 'QUOTE',
  DIVIDER = 'DIVIDER',
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
  /** Chỉ có ở Bài học (vd. khối Ôn tập) — Bài viết là trang tra cứu nên không hiện. */
  lessonOnly?: boolean;
}

// === Merged from quiz.types.ts & quiz-question.factory.ts ===
export enum QuizQuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ORDERING = 'ORDERING',
  MATCHING = 'MATCHING',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
}

interface BaseQuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  explanation?: string;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface SingleChoiceQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.SINGLE_CHOICE;
  options: MultipleChoiceOption[];
}

export interface MultipleChoiceQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.MULTIPLE_CHOICE;
  options: MultipleChoiceOption[];
}

export interface TrueFalseQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.TRUE_FALSE;
  correctAnswer: boolean;
}

export interface OrderingItem {
  id: string;
  label: string;
}

export interface OrderingQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.ORDERING;
  items: OrderingItem[];
  correctOrder: string[];
}

export interface MatchingItem {
  id: string;
  label: string;
}

export interface MatchingPair {
  leftId: string;
  rightId: string;
}

export interface MatchingQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.MATCHING;
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  correctPairs: MatchingPair[];
}

export interface FillInBlankQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.FILL_IN_BLANK;
  acceptedAnswers: string[];
  caseSensitive?: boolean;
}

export type QuizQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | OrderingQuestion
  | MatchingQuestion
  | FillInBlankQuestion;

export interface QuizItem {
  id: string;
  lessonId: string;
  title?: string | null;
  passingScorePercent?: number | null;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export const QUIZ_QUESTION_TYPE_META: Record<
  QuizQuestionType,
  { label: string; shortLabel: string; color: string }
> = {
  [QuizQuestionType.SINGLE_CHOICE]: {
    label: 'Chọn 1 đáp án',
    shortLabel: '1 đáp án',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  [QuizQuestionType.TRUE_FALSE]: {
    label: 'Đúng / Sai',
    shortLabel: 'Đúng/Sai',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  [QuizQuestionType.MULTIPLE_CHOICE]: {
    label: 'Nhiều đáp án',
    shortLabel: 'Nhiều đáp án',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  [QuizQuestionType.ORDERING]: {
    label: 'Sắp xếp thứ tự',
    shortLabel: 'Sắp xếp',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  [QuizQuestionType.MATCHING]: {
    label: 'Ghép nối',
    shortLabel: 'Ghép nối',
    color: 'text-violet-600 bg-violet-50 border-violet-200',
  },
  [QuizQuestionType.FILL_IN_BLANK]: {
    label: 'Điền vào chỗ trống',
    shortLabel: 'Điền khuyết',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },
};

let quizIdCounter = 0;
export const generateQuizId = (prefix: string): string => {
  quizIdCounter += 1;
  return `${prefix}_${Date.now()}_${quizIdCounter}`;
};

export function createDefaultQuestion(type: QuizQuestionType): QuizQuestion {
  const id = generateQuizId('q');

  switch (type) {
    case QuizQuestionType.SINGLE_CHOICE:
      return {
        id,
        type,
        prompt: '',
        options: [
          { id: generateQuizId('opt'), text: '', isCorrect: true },
          { id: generateQuizId('opt'), text: '', isCorrect: false },
        ],
      };

    case QuizQuestionType.MULTIPLE_CHOICE:
      return {
        id,
        type,
        prompt: '',
        options: [
          { id: generateQuizId('opt'), text: '', isCorrect: true },
          { id: generateQuizId('opt'), text: '', isCorrect: true },
          { id: generateQuizId('opt'), text: '', isCorrect: false },
        ],
      };

    case QuizQuestionType.TRUE_FALSE:
      return { id, type, prompt: '', correctAnswer: true };

    case QuizQuestionType.ORDERING: {
      const items = [
        { id: generateQuizId('item'), label: '' },
        { id: generateQuizId('item'), label: '' },
      ];
      return { id, type, prompt: '', items, correctOrder: items.map((i) => i.id) };
    }

    case QuizQuestionType.MATCHING: {
      const l1 = generateQuizId('l');
      const r1 = generateQuizId('r');
      return {
        id,
        type,
        prompt: '',
        leftItems: [{ id: l1, label: '' }],
        rightItems: [{ id: r1, label: '' }],
        correctPairs: [{ leftId: l1, rightId: r1 }],
      };
    }

    case QuizQuestionType.FILL_IN_BLANK:
      return { id, type, prompt: '', acceptedAnswers: [''], caseSensitive: false };

    default:
      throw new Error(`Dạng câu hỏi không được hỗ trợ: ${type}`);
  }
}

