/**
 * QUY TẮC GHÉP DÒNG ĐỜI NHÂN VẬT — dùng chung cho trang công khai (tab "Dòng thời gian" ở /nhan-vat,
 * qua services/entities/landing.service.ts) và CMS (khung "Xem trước dòng đời" trong ArticleProfilePanel),
 * để 2 nơi không bao giờ lệch nhau.
 *
 * Dòng đời = hợp của 3 nguồn (KHÔNG suy theo tag):
 *   LINK      — bài SỰ KIỆN mà nhân vật liên kết tới / được liên kết từ (ArticleLink, nhãn = vai trò).
 *               Năm + thời kỳ lấy từ mốc timeline đầu tiên trỏ tới bài sự kiện; không có mốc → năm của bài.
 *   OWN_NODE  — mốc timeline trỏ THẲNG tới bài nhân vật (vd. "Ngô Quyền xưng vương").
 *   MILESTONE — mốc đời riêng nhập trong hồ sơ nhân vật (metadata.person.milestones).
 */
import { formatYear } from '@/utils/year-label';

export interface LifeNodeRef {
  id: string;
  title: string;
  description?: string | null;
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  timeline: { id: string; slug: string; title: string };
}

export interface LifeEventArticle {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
  /** Mốc timeline trỏ tới bài sự kiện này. */
  nodes: LifeNodeRef[];
}

export interface LifeMilestoneInput {
  year: number;
  month?: number;
  day?: number;
  title: string;
  note?: string;
}

export interface LifeInput {
  ownNodes: LifeNodeRef[];
  eventLinks: Array<{ article: LifeEventArticle; label: string | null; direction: 'OUTGOING' | 'INCOMING' }>;
  milestones?: LifeMilestoneInput[];
}

export type LifeSource = 'LINK' | 'OWN_NODE' | 'MILESTONE';

export const LIFE_SOURCE_LABELS: Record<LifeSource, string> = {
  LINK: 'Liên kết tới bài sự kiện',
  OWN_NODE: 'Mốc trong dòng thời gian',
  MILESTONE: 'Mốc đời riêng',
};

export const DEFAULT_EVENT_ROLE = 'Tham gia';
export const OWN_MILESTONE_ROLE = 'Dấu mốc cuộc đời';
/** Vai trò coi là "chính" — hiện nổi bật trên dòng đời. */
const PRIMARY_ROLE_PATTERN = /chỉ huy|lãnh đạo|khởi xướng|thống lĩnh/i;

export interface LifeItem {
  key: string;
  source: LifeSource;
  /** null = chưa có năm (CMS cảnh báo; trang công khai bỏ qua). */
  year: number | null;
  dateLabel: string | null;
  title: string;
  description: string | null;
  role: string;
  isPrimary: boolean;
  /** Bài sự kiện (nguồn LINK). */
  article: { id: string; slug: string; title: string } | null;
  /** Mốc dùng để lấy năm / thời kỳ (nguồn LINK có mốc, OWN_NODE). */
  node: LifeNodeRef | null;
  timeline: { id: string; slug: string; title: string } | null;
}

/** Nhãn ngày của mốc: dateText → "19/8/1945" / "8/1945" / "1945" (năm âm thành TCN). */
export function nodeDateLabel(n: Pick<LifeNodeRef, 'dateText' | 'year' | 'month' | 'day' | 'endYear'>): string | null {
  if (n.dateText?.trim()) return n.dateText.trim();
  const year = formatYear(n.year);
  if (!year) return null;
  const head = n.day && n.month ? `${n.day}/${n.month}/` : n.month ? `${n.month}/` : '';
  const end = formatYear(n.endYear);
  return end && n.endYear !== n.year ? `${head}${year} – ${end}` : `${head}${year}`;
}

export function buildPersonLife(input: LifeInput): LifeItem[] {
  const items: LifeItem[] = [];

  for (const link of input.eventLinks) {
    const a = link.article;
    const node = a.nodes[0] ?? null;
    const role = link.label?.trim() || DEFAULT_EVENT_ROLE;
    const year = node?.year ?? a.startYear;
    items.push({
      key: `link-${a.id}`,
      source: 'LINK',
      year,
      dateLabel: node ? nodeDateLabel(node) : a.dateText || formatYear(a.startYear) || null,
      title: node?.title ?? a.title,
      description: node?.description ?? a.summary ?? null,
      role,
      isPrimary: PRIMARY_ROLE_PATTERN.test(role),
      article: { id: a.id, slug: a.slug, title: a.title },
      node,
      timeline: node?.timeline ?? null,
    });
  }

  for (const node of input.ownNodes) {
    items.push({
      key: `node-${node.id}`,
      source: 'OWN_NODE',
      year: node.year,
      dateLabel: nodeDateLabel(node),
      title: node.title,
      description: node.description ?? null,
      role: OWN_MILESTONE_ROLE,
      isPrimary: true,
      article: null,
      node,
      timeline: node.timeline,
    });
  }

  (input.milestones ?? []).forEach((m, i) => {
    items.push({
      key: `ms-${i}`,
      source: 'MILESTONE',
      year: m.year,
      dateLabel: nodeDateLabel({ dateText: null, year: m.year, month: m.month ?? null, day: m.day ?? null, endYear: null }),
      title: m.title,
      description: m.note ?? null,
      role: OWN_MILESTONE_ROLE,
      isPrimary: false,
      article: null,
      node: null,
      timeline: null,
    });
  });

  const sortKey = (it: LifeItem) =>
    it.year === null ? Number.POSITIVE_INFINITY : it.year * 10000 + (it.node?.month ?? 0) * 100 + (it.node?.day ?? 0);
  return items.sort((x, y) => sortKey(x) - sortKey(y));
}
