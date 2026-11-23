import { ReportActionTaken, ReportSource } from '@prisma/client';
import { ModerationTab } from './moderation.constant';

export function extractModerationBlockText(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const block = raw as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof block.heading === 'string') parts.push(block.heading);
  if (typeof block.text === 'string') parts.push(block.text);
  if (typeof block.content === 'string') {
    parts.push(block.content.replace(/<[^>]*>/g, ' '));
  }
  if (typeof block.quoteText === 'string') parts.push(block.quoteText);
  if (typeof block.caption === 'string') parts.push(block.caption);
  return parts;
}

export function extractModerationPostText(post: {
  title: string;
  excerpt?: string | null;
  contentBlocks?: unknown;
}): string {
  const parts: string[] = [post.title];
  if (post.excerpt) {
    parts.push(post.excerpt);
  }
  if (Array.isArray(post.contentBlocks)) {
    for (const raw of post.contentBlocks) {
      parts.push(...extractModerationBlockText(raw));
    }
  }
  return parts.filter(Boolean).join('\n');
}

export function matchesModerationTab(
  actionTaken: string,
  source: string,
  tab?: string,
): boolean {
  switch (tab) {
    case ModerationTab.PENDING:
      return (
        actionTaken === ReportActionTaken.NONE ||
        actionTaken === ReportActionTaken.AUTO_HIDDEN
      );
    case ModerationTab.AUTO_HIDDEN:
      return actionTaken === ReportActionTaken.AUTO_HIDDEN;
    case ModerationTab.USER_REPORT:
      return source === ReportSource.USER_REPORT;
    case ModerationTab.REMOVED:
      return actionTaken === ReportActionTaken.CONFIRMED_REMOVED;
    case ModerationTab.DISMISSED:
      return actionTaken === ReportActionTaken.DISMISSED;
    default:
      return true;
  }
}

export function matchesModerationSearch(item: any, search?: string): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const inTitle = (item.target?.title || '').toLowerCase().includes(q);
  const inExcerpt = (item.matchedExcerpt || '').toLowerCase().includes(q);
  const inReason = (item.reasonText || '').toLowerCase().includes(q);
  const inAuthor = (item.target?.author?.username || '')
    .toLowerCase()
    .includes(q);
  return inTitle || inExcerpt || inReason || inAuthor;
}
