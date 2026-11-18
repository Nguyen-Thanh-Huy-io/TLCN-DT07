import { BookOpen, CircleHelp, Highlighter, ListChecks, Star, StickyNote, type LucideIcon } from 'lucide-react';
import { NOTE_KIND, type NoteKindValue } from '../services/note.service';

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
    label: 'Tóm tắt',
    icon: ListChecks,
    placeholder: 'Tóm tắt mục này bằng lời của bạn...',
    decoration: null,
  },
};

/** Loại chọn được khi bôi đen một đoạn (Tóm tắt tạo từ mục lục). */
export const SELECTION_NOTE_KINDS: NoteKindValue[] = [
  NOTE_KIND.NOTE,
  NOTE_KIND.DEFINITION,
  NOTE_KIND.QUESTION,
  NOTE_KIND.IMPORTANT,
];

/** Khớp NOTE_LABEL_MAX_LENGTH / NOTE_LABELS_MAX ở backend/src/note/dto/note.dto.ts. */
export const NOTE_LABEL_MAX_LENGTH = 40;
export const NOTE_LABELS_MAX = 10;

export const isOpenQuestion = (note: { kind: NoteKindValue; resolvedAt: string | null }) =>
  note.kind === NOTE_KIND.QUESTION && !note.resolvedAt;
