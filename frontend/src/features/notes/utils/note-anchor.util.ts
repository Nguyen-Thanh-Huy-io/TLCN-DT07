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
  prefix?: string;
  suffix?: string;
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

/** Kết quả dò lại vị trí của một ghi chú khi mở bài. */
export enum AnchorMatch {
  /** Đúng đoạn, đúng chữ trước / sau (bài chưa đổi ở chỗ này). */
  EXACT = 'EXACT',
  /** Đoạn còn nguyên nhưng đã dời chỗ / chữ xung quanh đổi → tự cập nhật vị trí. */
  MOVED = 'MOVED',
  /** Chỉ khớp gần đúng (đoạn bị sửa dấu câu, hoa thường) → cần người học xác nhận. */
  FUZZY = 'FUZZY',
}

export interface LocatedAnchor {
  range: Range;
  match: AnchorMatch;
}

/**
 * Bản rút gọn của chuỗi kèm vị trí gốc từng ký tự. `loose` bỏ thêm dấu câu / ký hiệu và hạ chữ thường
 * để khớp gần đúng khi đoạn chỉ bị sửa nhẹ.
 */
function normalizeWithMap(text: string, loose: boolean): { value: string; toRaw: number[] } {
  let value = '';
  const toRaw: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (loose && /[\p{P}\p{S}]/u.test(ch)) continue;
    const isSpace = /\s/.test(ch);
    if (isSpace && (value === '' || value.endsWith(' '))) continue;
    value += isSpace ? ' ' : loose ? ch.toLocaleLowerCase('vi') : ch;
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

/** Mọi chỗ xuất hiện của `needle`, chọn chỗ có chữ trước / sau giống `anchor` nhất. */
function bestOccurrence(
  haystack: string,
  needle: string,
  context: { prefix: string; suffix: string } | null,
): { at: number; contextMatched: boolean } | null {
  let best: { at: number; score: number } | null = null;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
    const score = context
      ? commonSuffixLength(haystack.slice(0, at), context.prefix) +
        commonPrefixLength(haystack.slice(at + needle.length), context.suffix)
      : 0;
    if (!best || score > best.score) best = { at, score };
  }
  if (!best) return null;
  const contextMatched = !context || best.score >= context.prefix.length + context.suffix.length;
  return { at: best.at, contextMatched };
}

/**
 * Tìm lại đoạn ghi chú trong bài: khớp nguyên văn trước (EXACT nếu chữ trước / sau cũng khớp, không thì
 * MOVED), không được thì khớp gần đúng (FUZZY). Null khi bài đã sửa mất đoạn đó.
 */
export function locateHighlight(
  index: TextIndex,
  highlightText: string,
  anchor: NoteAnchor | null,
): LocatedAnchor | null {
  for (const loose of [false, true]) {
    const haystack = normalizeWithMap(index.text, loose);
    const needle = normalizeWithMap(highlightText.trim(), loose).value;
    if (!needle) return null;
    // Ghi chú cũ chưa có chữ trước / sau thì coi như khớp ngay ở lần xuất hiện đầu.
    const context =
      anchor?.prefix !== undefined || anchor?.suffix !== undefined
        ? {
            prefix: normalizeWithMap(anchor?.prefix ?? '', loose).value,
            suffix: normalizeWithMap(anchor?.suffix ?? '', loose).value,
          }
        : null;
    const hit = bestOccurrence(haystack.value, needle, context);
    if (!hit) continue;
    const range = rangeFromOffsets(
      index,
      haystack.toRaw[hit.at],
      haystack.toRaw[hit.at + needle.length - 1] + 1,
    );
    if (!range) return null;
    if (loose) return { range, match: AnchorMatch.FUZZY };
    return { range, match: hit.contextMatched ? AnchorMatch.EXACT : AnchorMatch.MOVED };
  }
  return null;
}

const headingTextOf = (el: Element) => normalizeWithMap(el.textContent ?? '', true).value;

/**
 * Mục được tóm tắt: id tiêu đề đánh theo thứ tự nên có thể lệch khi bài thêm / bớt mục — kiểm thêm tên
 * mục (`highlightText`), lệch thì tìm tiêu đề cùng tên.
 */
export function locateHeading(root: HTMLElement, headingId: string, headingText: string | null): LocatedAnchor | null {
  const wanted = headingText ? normalizeWithMap(headingText, true).value : null;
  const byId = root.querySelector(`[id="${CSS.escape(headingId)}"]`);
  const sameName = (el: Element | null) => el && (!wanted || headingTextOf(el) === wanted);
  const heading = sameName(byId)
    ? byId
    : wanted
      ? [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((el) => headingTextOf(el) === wanted) ?? null
      : null;
  if (!heading) return null;
  const range = document.createRange();
  range.selectNodeContents(heading);
  return { range, match: heading === byId ? AnchorMatch.EXACT : AnchorMatch.MOVED };
}
