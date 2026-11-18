/**
 * Ghép đoạn ghi chú với vị trí trong bài đọc mà không chèn thẻ nào vào nội dung (nội dung do React /
 * dangerouslySetInnerHTML quản lý, tự chèn <mark> sẽ bị xoá khi vẽ lại hoặc làm hỏng khối quiz).
 */
import { LESSON_QUIZ_PLACEHOLDER_ATTR } from '@/features/lessons/utils/lesson-quiz.util';

/** Khớp NOTE_ANCHOR_CONTEXT_MAX_LENGTH / NOTE_HIGHLIGHT_MAX_LENGTH ở backend/src/note/dto/note.dto.ts. */
export const NOTE_ANCHOR_CONTEXT_LENGTH = 64;
export const NOTE_HIGHLIGHT_MAX_LENGTH = 1000;

/** Khối quiz tương tác trong bài học: không cho bôi đen ghi chú, không tính vào văn bản. */
const SKIPPED_SUBTREE_SELECTOR = `[${LESSON_QUIZ_PLACEHOLDER_ATTR}]`;
const BLOCK_TAGS = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'FIGCAPTION', 'DIV', 'SECTION']);

export interface NoteAnchor {
  prefix: string;
  suffix: string;
}

interface TextNodeEntry {
  node: Text;
  start: number;
}

/** Văn bản của bài (giữa các khối chèn '\n') kèm vị trí từng text node trong chuỗi đó. */
export interface TextIndex {
  text: string;
  entries: TextNodeEntry[];
}

function blockOf(node: Node, root: HTMLElement): Element | null {
  let el = node.parentElement;
  while (el && el !== root && !BLOCK_TAGS.has(el.tagName)) el = el.parentElement;
  return el;
}

export function buildTextIndex(root: HTMLElement): TextIndex {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(SKIPPED_SUBTREE_SELECTOR) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const entries: TextNodeEntry[] = [];
  let text = '';
  let lastBlock: Element | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!(node instanceof Text)) continue;
    const block = blockOf(node, root);
    if (entries.length > 0 && block !== lastBlock) text += '\n';
    lastBlock = block;
    entries.push({ node, start: text.length });
    text += node.nodeValue ?? '';
  }
  return { text, entries };
}

/** Vị trí (trong `index.text`) của một mốc DOM; mốc nằm ở phần tử thì lấy text node đầu tiên sau nó. */
function offsetOfBoundary(index: TextIndex, container: Node, offset: number): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const entry = index.entries.find((e) => e.node === container);
    return entry ? entry.start + offset : null;
  }
  const boundary = document.createRange();
  boundary.setStart(container, offset);
  const after = index.entries.find((e) => boundary.comparePoint(e.node, 0) >= 0);
  return after ? after.start : index.text.length;
}

function rangeFromOffsets(index: TextIndex, start: number, end: number): Range | null {
  const startEntry = index.entries.findLast((e) => e.start <= start);
  const endEntry = index.entries.findLast((e) => e.start < end);
  if (!startEntry || !endEntry) return null;
  const range = document.createRange();
  range.setStart(startEntry.node, Math.min(start - startEntry.start, startEntry.node.length));
  range.setEnd(endEntry.node, Math.min(end - endEntry.start, endEntry.node.length));
  return range;
}

export interface SelectionAnchor {
  highlightText: string;
  anchor: NoteAnchor;
}

/** Vùng bôi đen → đoạn chữ (đã bỏ khoảng trắng 2 đầu) + chữ trước / sau; null nếu không ghi chú được. */
export function anchorFromRange(index: TextIndex, root: HTMLElement, range: Range): SelectionAnchor | null {
  if (!root.contains(range.commonAncestorContainer)) return null;
  const startEl = range.startContainer.parentElement;
  if (startEl?.closest(SKIPPED_SUBTREE_SELECTOR)) return null;
  let start = offsetOfBoundary(index, range.startContainer, range.startOffset);
  let end = offsetOfBoundary(index, range.endContainer, range.endOffset);
  if (start === null || end === null) return null;
  while (start < end && /\s/.test(index.text[start])) start++;
  while (end > start && /\s/.test(index.text[end - 1])) end--;
  if (end <= start || end - start > NOTE_HIGHLIGHT_MAX_LENGTH) return null;
  return {
    highlightText: index.text.slice(start, end),
    anchor: {
      prefix: index.text.slice(Math.max(0, start - NOTE_ANCHOR_CONTEXT_LENGTH), start),
      suffix: index.text.slice(end, end + NOTE_ANCHOR_CONTEXT_LENGTH),
    },
  };
}

/** Bản rút gọn khoảng trắng của chuỗi kèm vị trí gốc từng ký tự — để ghi chú cũ (lưu từ selection.toString) vẫn khớp. */
function collapseWhitespace(text: string): { value: string; toRaw: number[] } {
  let value = '';
  const toRaw: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const isSpace = /\s/.test(text[i]);
    if (isSpace && value.endsWith(' ')) continue;
    value += isSpace ? ' ' : text[i];
    toRaw.push(i);
  }
  return { value, toRaw };
}

const commonSuffixLength = (a: string, b: string) => {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
};

const commonPrefixLength = (a: string, b: string) => {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
};

/**
 * Tìm lại đoạn ghi chú trong bài. Đoạn xuất hiện nhiều lần thì chọn chỗ có chữ trước / sau giống `anchor`
 * nhất; không có `anchor` (ghi chú cũ) thì lấy lần đầu. Trả null khi bài đã sửa mất đoạn đó.
 */
export function locateHighlight(index: TextIndex, highlightText: string, anchor: NoteAnchor | null): Range | null {
  const haystack = collapseWhitespace(index.text);
  const needle = collapseWhitespace(highlightText.trim()).value;
  if (!needle) return null;

  let best: { at: number; score: number } | null = null;
  for (let at = haystack.value.indexOf(needle); at !== -1; at = haystack.value.indexOf(needle, at + 1)) {
    const score = anchor
      ? commonSuffixLength(haystack.value.slice(0, at), collapseWhitespace(anchor.prefix).value) +
        commonPrefixLength(haystack.value.slice(at + needle.length), collapseWhitespace(anchor.suffix).value)
      : 0;
    if (!best || score > best.score) best = { at, score };
    if (!anchor) break;
  }
  if (!best) return null;
  const rawStart = haystack.toRaw[best.at];
  const rawEnd = haystack.toRaw[best.at + needle.length - 1] + 1;
  return rangeFromOffsets(index, rawStart, rawEnd);
}
