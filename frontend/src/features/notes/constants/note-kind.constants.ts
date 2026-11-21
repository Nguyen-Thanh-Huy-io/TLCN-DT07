import {
  BookOpen,
  Circle,
  CircleHelp,
  Highlighter,
  ListChecks,
  PenLine,
  Star,
  StickyNote,
  Strikethrough,
  Underline,
  type LucideIcon,
} from 'lucide-react';
import {
  NOTE_COLOR,
  NOTE_KIND,
  NOTE_MARKUP_STYLE,
  type NoteAnchorValue,
  type NoteColorValue,
  type NoteKindValue,
  type NoteMarkupStyleValue,
} from '../services/note.service';
import { resolveNoteMarkupHighlightNames } from '../utils/note-cluster.util';

export interface NoteKindMeta {
  label: string;
  icon: LucideIcon;
  /** Gợi ý trong ô nhập; null = loại này không có ô nhập khi tạo nhanh (chỉ đánh dấu). */
  placeholder: string | null;
  /** Tên vùng tô thêm (gạch chân) theo loại, khai báo ở globals.css; null = chỉ tô nền màu. */
  decoration: string | null;
}

/** Thứ tự = thứ tự hiện trong popup chọn loại và bộ lọc sổ ghi chú. */
export const NOTE_KIND_META: Record<NoteKindValue, NoteKindMeta> = {
  [NOTE_KIND.HIGHLIGHT]: { label: 'Tô sáng', icon: Highlighter, placeholder: null, decoration: null },
  [NOTE_KIND.NOTE]: { label: 'Ghi chú', icon: StickyNote, placeholder: 'Ghi chú của bạn về đoạn này...', decoration: null },
  [NOTE_KIND.DEFINITION]: {
    label: 'Định nghĩa',
    icon: BookOpen,
    placeholder: 'Định nghĩa / cách hiểu của thuật ngữ này...',
    decoration: 'hisgo-note-kind-definition',
  },
  [NOTE_KIND.QUESTION]: {
    label: 'Câu hỏi',
    icon: CircleHelp,
    placeholder: 'Điều bạn chưa hiểu, cần tìm hiểu thêm...',
    decoration: 'hisgo-note-kind-question',
  },
  [NOTE_KIND.IMPORTANT]: {
    label: 'Quan trọng',
    icon: Star,
    placeholder: null,
    decoration: 'hisgo-note-kind-important',
  },
  [NOTE_KIND.SUMMARY]: {
    label: 'Tóm tắt cụm',
    icon: ListChecks,
    placeholder: 'Tóm tắt ý chính của đoạn / cụm này bằng lời của bạn...',
    decoration: null,
  },
};

/** Loại chọn được khi bôi đen một đoạn (hoặc viết ghi chú). */
export const SELECTION_NOTE_KINDS: NoteKindValue[] = [
  NOTE_KIND.NOTE,
  NOTE_KIND.DEFINITION,
  NOTE_KIND.QUESTION,
  NOTE_KIND.IMPORTANT,
];

/** Loại chọn được khi gắn Sticky Note nguyên cụm đoạn văn. */
export const BLOCK_STICKY_NOTE_KINDS: NoteKindValue[] = [
  NOTE_KIND.SUMMARY,
  NOTE_KIND.NOTE,
  NOTE_KIND.QUESTION,
  NOTE_KIND.IMPORTANT,
];

export interface NoteMarkupStyleMeta {
  label: string;
  icon: LucideIcon;
  cssPrefix: string;
}

/** Ánh xạ kiểu nét đánh dấu -> icon + tiền tố tên vùng CSS.highlights trong globals.css (OCP). */
export const NOTE_MARKUP_STYLE_META: Record<NoteMarkupStyleValue, NoteMarkupStyleMeta> = {
  [NOTE_MARKUP_STYLE.HIGHLIGHT]: { label: 'Tô sáng', icon: Highlighter, cssPrefix: 'hisgo-note' },
  [NOTE_MARKUP_STYLE.UNDERLINE]: { label: 'Gạch chân', icon: Underline, cssPrefix: 'hisgo-note-underline' },
  [NOTE_MARKUP_STYLE.CIRCLE]: { label: 'Khoanh chữ', icon: Circle, cssPrefix: '' },
  [NOTE_MARKUP_STYLE.STRIKETHROUGH]: { label: 'Gạch ngang', icon: Strikethrough, cssPrefix: 'hisgo-note-strike' },
  [NOTE_MARKUP_STYLE.CALLOUT]: { label: 'Điền bổ sung', icon: PenLine, cssPrefix: 'hisgo-note-underline' },
};

/** 4 nét đánh dấu tức thì (1-click) trên Mini Pill & Bút tô nhanh. */
export const MARKUP_STYLE_OPTIONS: NoteMarkupStyleValue[] = [
  NOTE_MARKUP_STYLE.HIGHLIGHT,
  NOTE_MARKUP_STYLE.UNDERLINE,
  NOTE_MARKUP_STYLE.CIRCLE,
  NOTE_MARKUP_STYLE.STRIKETHROUGH,
];

/** Toàn bộ nét đánh dấu gồm cả điền chữ bổ sung (Quick Pen Bar). */
export const ALL_QUICK_PEN_STYLES: NoteMarkupStyleValue[] = [
  ...MARKUP_STYLE_OPTIONS,
  NOTE_MARKUP_STYLE.CALLOUT,
];

/** Danh sách tên CSS Custom Highlight cần áp lên 1 ghi chú nội tuyến. */
export function cssHighlightNamesFor(note: {
  kind: NoteKindValue;
  color: NoteColorValue;
  anchor?: NoteAnchorValue | null;
}): string[] {
  return resolveNoteMarkupHighlightNames(note);
}

/** Khớp NOTE_LABEL_MAX_LENGTH / NOTE_LABELS_MAX ở backend/src/note/dto/note.dto.ts. */
export const NOTE_LABEL_MAX_LENGTH = 40;
export const NOTE_LABELS_MAX = 10;

export const NOTE_ACTIVE_COLOR_STORAGE_KEY = 'hisgo:note-active-color';

/** Màu mặc định khi chọn loại (người học vẫn đổi được). */
export const DEFAULT_KIND_COLOR: Record<NoteKindValue, NoteColorValue> = {
  HIGHLIGHT: NOTE_COLOR.YELLOW,
  NOTE: NOTE_COLOR.GREEN,
  DEFINITION: NOTE_COLOR.BLUE,
  QUESTION: NOTE_COLOR.PINK,
  IMPORTANT: NOTE_COLOR.PINK,
  SUMMARY: NOTE_COLOR.PURPLE,
};

export const readStoredActiveColor = (): NoteColorValue => {
  if (typeof window === 'undefined') return NOTE_COLOR.YELLOW;
  try {
    const saved = localStorage.getItem(NOTE_ACTIVE_COLOR_STORAGE_KEY) as NoteColorValue | null;
    if (saved && Object.values(NOTE_COLOR).includes(saved)) return saved;
  } catch {
    // Bỏ qua lỗi storage ở chế độ ẩn danh.
  }
  return NOTE_COLOR.YELLOW;
};

export const persistStoredActiveColor = (color: NoteColorValue) => {
  try {
    localStorage.setItem(NOTE_ACTIVE_COLOR_STORAGE_KEY, color);
  } catch {
    // Bỏ qua lỗi storage ở chế độ ẩn danh.
  }
};

export const isOpenQuestion = (note: { kind: NoteKindValue; resolvedAt: string | null }) =>
  note.kind === NOTE_KIND.QUESTION && !note.resolvedAt;
