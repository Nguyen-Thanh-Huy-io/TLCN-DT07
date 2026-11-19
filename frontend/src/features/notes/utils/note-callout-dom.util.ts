import type { LocatedNote } from '../hooks/useNoteHighlights';
import { NOTE_ANCHOR_MODE, NOTE_COLOR_STYLES, NOTE_MARKUP_STYLE } from '../services/note.service';
import { NOTE_CALLOUT_ATTR } from './note-cluster.util';

const CALLOUT_SELECTOR = `[${NOTE_CALLOUT_ATTR}]`;
const CALLOUT_MAX_INLINE_CHARS = 72;

/** Gỡ toàn bộ chip điền chữ bổ sung trước khi lập chỉ mục lại văn bản gốc. */
export function clearInlineCallouts(root: HTMLElement): void {
  root.querySelectorAll(CALLOUT_SELECTOR).forEach((el) => el.remove());
}

function buildCalloutElement(note: LocatedNote['note']): HTMLButtonElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.setAttribute(NOTE_CALLOUT_ATTR, note.id);
  const styles = NOTE_COLOR_STYLES[note.color];
  const raw = note.content.trim();
  const display = raw.length > CALLOUT_MAX_INLINE_CHARS
    ? `${raw.slice(0, CALLOUT_MAX_INLINE_CHARS - 1).trimEnd()}…`
    : raw;

  chip.title = raw;
  chip.className = `mx-1 inline-flex cursor-pointer items-baseline rounded border-b border-dashed bg-[#FFFBF2]/95 px-1.5 py-0 text-[0.82em] font-semibold italic leading-snug not-italic shadow-2xs transition hover:opacity-80 ${styles.ink}`;
  chip.style.borderColor = styles.stroke;
  chip.style.fontStyle = 'italic';
  chip.style.fontWeight = '600';
  chip.textContent = `↳ ${display}`;
  return chip;
}

/**
 * Chèn chữ bổ sung ngay sau từ/cụm đã neo (không tính vào chỉ mục text nhờ `SKIPPED_SUBTREE_SELECTOR`).
 */
export function mountInlineCallouts(root: HTMLElement, located: readonly LocatedNote[]): void {
  clearInlineCallouts(root);

  for (const item of located) {
    if (item.mode !== NOTE_ANCHOR_MODE.INLINE) continue;
    if (item.note.anchor?.style !== NOTE_MARKUP_STYLE.CALLOUT) continue;
    if (!item.note.content.trim()) continue;

    const chip = buildCalloutElement(item.note);
    const endNode = item.range.endContainer;
    const interactiveAncestor = (endNode instanceof Element ? endNode : endNode.parentElement)?.closest('a, button');
    if (interactiveAncestor && root.contains(interactiveAncestor)) {
      interactiveAncestor.after(chip);
      continue;
    }

    try {
      const insertPoint = item.range.cloneRange();
      insertPoint.collapse(false);
      insertPoint.insertNode(chip);
    } catch {
      // Nếu biên DOM phức tạp không chèn được thì bỏ qua an toàn, ghi chú vẫn mở được ở Sổ/hover.
    }
  }
}
