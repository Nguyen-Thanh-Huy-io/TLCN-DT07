import { NOTE_ANCHOR_MODE, type NoteAnchorModeValue, type NoteAnchorValue, type NoteItem } from '../services/note.service';
import {
  AnchorMatch,
  anchorFromRange,
  buildBlockClusterAnchor,
  locateBlockCluster,
  locateHeading,
  locateHighlight,
  type TextIndex,
} from './note-anchor.util';
import { isBlockClusterAnchor, isInkAnchor } from './note-cluster.util';

export interface AnchorResolveContext {
  root: HTMLElement;
  index: TextIndex;
  blocks: HTMLElement[];
}

export interface ResolvedAnchorResult {
  range: Range;
  match: AnchorMatch;
  mode: NoteAnchorModeValue;
  blockElements?: HTMLElement[];
}

interface NoteAnchorClientStrategy {
  readonly mode: NoteAnchorModeValue;
  matches(note: NoteItem): boolean;
  locate(ctx: AnchorResolveContext, note: NoteItem): ResolvedAnchorResult | null;
  freshAnchor(ctx: AnchorResolveContext, note: NoteItem, located: ResolvedAnchorResult): NoteAnchorValue | null;
}

class BlockClusterClientStrategy implements NoteAnchorClientStrategy {
  readonly mode = NOTE_ANCHOR_MODE.BLOCK;

  matches(note: NoteItem): boolean {
    return isBlockClusterAnchor(note.anchor);
  }

  locate(ctx: AnchorResolveContext, note: NoteItem): ResolvedAnchorResult | null {
    if (!note.anchor) return null;
    const hit = locateBlockCluster(ctx.blocks, note.anchor, note.highlightText);
    if (!hit) return null;
    return {
      range: hit.range,
      match: hit.match,
      mode: NOTE_ANCHOR_MODE.BLOCK,
      blockElements: hit.elements,
    };
  }

  freshAnchor(ctx: AnchorResolveContext, note: NoteItem, located: ResolvedAnchorResult): NoteAnchorValue | null {
    const first = located.blockElements?.[0];
    const last = located.blockElements?.[located.blockElements.length - 1];
    if (!first || !last) return null;
    const blockStart = ctx.blocks.indexOf(first);
    const blockEnd = ctx.blocks.indexOf(last);
    if (blockStart < 0 || blockEnd < blockStart) return null;
    return buildBlockClusterAnchor(ctx.blocks, blockStart, blockEnd, note.anchor?.style).anchor;
  }
}

class HeadingClientStrategy implements NoteAnchorClientStrategy {
  readonly mode = NOTE_ANCHOR_MODE.HEADING;

  matches(note: NoteItem): boolean {
    return !isBlockClusterAnchor(note.anchor) && Boolean(note.anchor?.headingId);
  }

  locate(ctx: AnchorResolveContext, note: NoteItem): ResolvedAnchorResult | null {
    const headingId = note.anchor?.headingId;
    if (!headingId) return null;
    const hit = locateHeading(ctx.root, headingId, note.highlightText);
    return hit ? { ...hit, mode: NOTE_ANCHOR_MODE.HEADING } : null;
  }

  freshAnchor(ctx: AnchorResolveContext, note: NoteItem, located: ResolvedAnchorResult): NoteAnchorValue | null {
    const start = located.range.startContainer;
    const section = (start instanceof Element ? start : start.parentElement)?.closest('[id]');
    if (!section || !ctx.root.contains(section)) return null;
    return { mode: NOTE_ANCHOR_MODE.HEADING, headingId: section.id, style: note.anchor?.style };
  }
}

class InlineClientStrategy implements NoteAnchorClientStrategy {
  readonly mode = NOTE_ANCHOR_MODE.INLINE;

  matches(note: NoteItem): boolean {
    return !isBlockClusterAnchor(note.anchor) && !note.anchor?.headingId && Boolean(note.highlightText);
  }

  locate(ctx: AnchorResolveContext, note: NoteItem): ResolvedAnchorResult | null {
    if (!note.highlightText) return null;
    const hit = locateHighlight(ctx.index, note.highlightText, note.anchor);
    return hit ? { ...hit, mode: NOTE_ANCHOR_MODE.INLINE } : null;
  }

  freshAnchor(ctx: AnchorResolveContext, note: NoteItem, located: ResolvedAnchorResult): NoteAnchorValue | null {
    const fresh = anchorFromRange(ctx.index, ctx.root, located.range)?.anchor;
    if (!fresh) return null;
    return {
      ...fresh,
      ...(note.anchor?.mode ? { mode: note.anchor.mode } : {}),
      ...(note.anchor?.style ? { style: note.anchor.style } : {}),
    };
  }
}

class InkClientStrategy implements NoteAnchorClientStrategy {
  readonly mode = NOTE_ANCHOR_MODE.INK;

  matches(note: NoteItem): boolean {
    return isInkAnchor(note.anchor);
  }

  locate(ctx: AnchorResolveContext, note: NoteItem): ResolvedAnchorResult | null {
    if (!note.anchor) return null;
    const hit = locateBlockCluster(ctx.blocks, { ...note.anchor, blockEnd: note.anchor.blockStart }, note.highlightText);
    if (!hit) return null;
    return {
      range: hit.range,
      match: hit.match,
      mode: NOTE_ANCHOR_MODE.INK,
      blockElements: hit.elements,
    };
  }

  freshAnchor(ctx: AnchorResolveContext, note: NoteItem, located: ResolvedAnchorResult): NoteAnchorValue | null {
    const first = located.blockElements?.[0];
    if (!first || !note.anchor) return null;
    const blockStart = ctx.blocks.indexOf(first);
    if (blockStart < 0) return null;
    const base = buildBlockClusterAnchor(ctx.blocks, blockStart, blockStart).anchor;
    return {
      ...note.anchor,
      mode: NOTE_ANCHOR_MODE.INK,
      blockStart,
      startHint: base.startHint,
    };
  }
}

const STRATEGIES: readonly NoteAnchorClientStrategy[] = [
  new InkClientStrategy(),
  new BlockClusterClientStrategy(),
  new HeadingClientStrategy(),
  new InlineClientStrategy(),
];

export function resolveNoteAnchor(ctx: AnchorResolveContext, note: NoteItem): ResolvedAnchorResult | null {
  const strategy = STRATEGIES.find((s) => s.matches(note));
  return strategy ? strategy.locate(ctx, note) : null;
}

export function computeFreshAnchor(
  ctx: AnchorResolveContext,
  note: NoteItem,
  located: ResolvedAnchorResult,
): NoteAnchorValue | null {
  const strategy = STRATEGIES.find((s) => s.mode === located.mode);
  return strategy ? strategy.freshAnchor(ctx, note, located) : null;
}
