import { ContentStatus, Prisma } from '@prisma/client';
import { formatHistoricalYear } from '../common/utils/historical-date.parser';

/**
 * Nhãn niên đại DUY NHẤT cho toàn bộ trang công khai — frontend hiển thị nguyên `dateLabel`,
 * không tự format năm nữa (trước đây logic TCN bị chép ở ≥7 file frontend).
 *  - Có dateText (biên tập viên tự ghi) → dùng nguyên văn.
 *  - Có khoảng năm → "1228 – 1300", "179 TCN – 43".
 *  - Chỉ năm bắt đầu → "938".
 */
export function buildDateLabel(input: {
  dateText?: string | null;
  startYear?: number | null;
  endYear?: number | null;
}): string | null {
  if (input.dateText?.trim()) return input.dateText.trim();
  const start = formatHistoricalYear(input.startYear);
  const end = formatHistoricalYear(input.endYear);
  if (start && end && input.endYear !== input.startYear)
    return `${start} – ${end}`;
  return start || end || null;
}

/** Nhãn của một mốc: dateText → "19/8/1945" / "8/1945" / "1945" (năm âm thành TCN). */
export function buildNodeDateLabel(node: {
  dateText?: string | null;
  year?: number | null;
  month?: number | null;
  day?: number | null;
  endYear?: number | null;
}): string | null {
  if (node.dateText?.trim()) return node.dateText.trim();
  const year = formatHistoricalYear(node.year);
  if (!year) return null;
  const head =
    node.day && node.month
      ? `${node.day}/${node.month}/`
      : node.month
        ? `${node.month}/`
        : '';
  const end = formatHistoricalYear(node.endYear);
  return end && node.endYear !== node.year
    ? `${head}${year} – ${end}`
    : `${head}${year}`;
}

export const PUBLIC_ARTICLE_SUMMARY_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  coverImageUrl: true,
  dateText: true,
  startYear: true,
  endYear: true,
  isFeatured: true,
  metadata: true,
  topicId: true,
  /** Liên kết do bài khai báo — chiều ngược (bài khác trỏ tới) frontend tự suy từ danh sách. */
  linksOut: {
    where: { target: { status: ContentStatus.PUBLISHED } },
    orderBy: { displayOrder: 'asc' },
    select: { targetId: true, label: true, note: true },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      kind: true,
      parentId: true,
    },
  },
  articleTags: {
    select: { tag: { select: { id: true, name: true, colorHex: true } } },
  },
} satisfies Prisma.ArticleSelect;

type ArticleSummaryRow = Prisma.ArticleGetPayload<{
  select: typeof PUBLIC_ARTICLE_SUMMARY_SELECT;
}>;

export function toArticleSummary(row: ArticleSummaryRow) {
  const { articleTags, linksOut, ...rest } = row;
  return {
    ...rest,
    links: linksOut,
    dateLabel: buildDateLabel(row),
    tags: articleTags.map((at) => at.tag),
  };
}

export type PublicArticleSummary = ReturnType<typeof toArticleSummary>;
