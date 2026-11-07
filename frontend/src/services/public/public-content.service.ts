/**
 * Đọc API công khai /public/* — dùng trong Server Component (fetch thuần, không axios/token).
 * Lỗi mạng / 404: danh sách trả [], chi tiết trả null — trang tự hiển thị trạng thái rỗng.
 *
 * Mọi nhãn niên đại (`dateLabel`) do backend tính sẵn (năm âm → "TCN"), frontend chỉ hiển thị.
 */

import type { ArticleKind } from './article-kind';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000').replace(
  '://localhost',
  '://127.0.0.1',
);

export const PUBLIC_ROUTES = {
  ARTICLE: (slug: string) => `/bai-viet/${slug}`,
  CATEGORY: (slug: string) => `/chuyen-muc/${slug}`,
  TIMELINES: '/dong-thoi-gian',
  /** Mỗi dòng thời gian hiển thị như 1 "thời kỳ" ở /giai-doan/[slug] (giao diện cũ). */
  TIMELINE: (slug: string) => `/giai-doan/${slug}`,
  LESSON: (slug: string) => `/bai-hoc/${slug}`,
  TAG: (id: string) => `/tag/${id}`,
} as const;

export interface PublicTag {
  id: string;
  name: string;
  colorHex: string | null;
}

export interface PublicCategoryRef {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  /** Loại bài; null = kế thừa chuyên mục cha (xem services/public/article-kind.ts). */
  kind?: ArticleKind | null;
  parentId?: string | null;
}

/**
 * Hồ sơ mô tả TÙY CHỌN (Article.metadata) — cấu trúc + mã hợp lệ: backend/src/article/article-metadata.ts.
 * Mọi trường có thể thiếu. Liên kết bài ↔ bài nằm ở `links` (bảng article_links), không ở đây.
 */
export interface PersonProfileMeta {
  titles?: string[];
  occupation?: string;
  roles?: string[];
  birthDateLabel?: string;
  deathDateLabel?: string;
  hometown?: string;
  backgroundAndYouth?: string;
  notableWorks?: string[];
  legacyAndHonors?: string;
  anecdotes?: string[];
  famousQuote?: string;
  /**
   * Mốc đời riêng (việc nhỏ không đáng thành bài sự kiện) — hiện trong dòng đời.
   * `year` luôn có ở dữ liệu đã lưu (backend bắt buộc); chỉ trống khi đang soạn trong CMS.
   */
  milestones?: Array<{ year?: number; month?: number; day?: number; title: string; note?: string }>;
}

export interface SiteProfileMeta {
  address?: string;
  latitude?: number;
  longitude?: number;
  siteType?: string;
  rank?: string;
  recognizedYear?: string;
  preservation?: string;
  statusNote?: string;
  managingAgency?: string;
  architecturalStyle?: string;
  openingHours?: string;
}

export interface EventProfileMeta {
  dateNote?: string;
  cause?: string;
  outcome?: string;
  belligerents?: string[];
}

export interface ArticleMetadata {
  aliases?: string[];
  region?: string;
  sources?: string[];
  person?: PersonProfileMeta;
  site?: SiteProfileMeta;
  event?: EventProfileMeta;
}

/** Liên kết do bài khai báo (chỉ tới bài đã xuất bản). Nhãn chữ tự do, có thể null. */
export interface PublicArticleLink {
  targetId: string;
  label: string | null;
  note: string | null;
}

export interface PublicArticleSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
  dateLabel: string | null;
  isFeatured: boolean;
  metadata: ArticleMetadata | null;
  links: PublicArticleLink[];
  category: PublicCategoryRef | null;
  tags: PublicTag[];
}

export interface PublicArticleNeighbour {
  slug: string;
  title: string;
  dateLabel: string | null;
}

export interface PublicArticleDetail extends PublicArticleSummary {
  coverCaption: string | null;
  contentBlocks: unknown;
  datePrecision: string | null;
  publishedAt: string | null;
  updatedAt: string;
  timelines: Array<{ slug: string; title: string; nodeTitle: string }>;
  related: PublicArticleSummary[];
  previous: PublicArticleNeighbour | null;
  next: PublicArticleNeighbour | null;
}

export interface PublicCategory extends PublicCategoryRef {
  parentId: string | null;
  description: string | null;
  displayOrder: number;
  articleCount: number;
}

export interface PublicCategoryDetail extends PublicCategoryRef {
  description: string | null;
  parent: { id: string; name: string; slug: string } | null;
  children: PublicCategoryRef[];
  articles: PublicArticleSummary[];
}

export interface PublicTimelineNode {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  displayOrder: number;
  dateLabel: string | null;
  article: { slug: string; title: string; coverImageUrl: string | null; category: { name: string; slug: string; icon: string | null } | null } | null;
}

export interface PublicTimeline {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  nodes: PublicTimelineNode[];
}

export interface PublicTagWithCount extends PublicTag {
  description: string | null;
  articleCount: number;
}

export interface PublicLibraryLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  difficulty: string;
  estimatedReadMinutes: number;
  tags: PublicTag[];
}

export interface PublicTopicDetail {
  id: string;
  slug: string;
  name: string;
  eyebrow: string | null;
  icon: string | null;
  description: string | null;
  coverImageUrl: string | null;
  children: Omit<PublicTopicDetail, 'children'>[];
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data ?? body) as T;
  } catch {
    return null;
  }
}

const list = async <T,>(path: string): Promise<T[]> => {
  const data = await getJson<T[]>(path);
  return Array.isArray(data) ? data : [];
};

const enc = encodeURIComponent;

export const fetchCategories = () => list<PublicCategory>('/public/categories');
export const fetchCategory = (slug: string) => getJson<PublicCategoryDetail>(`/public/categories/${enc(slug)}`);

export function fetchArticles(params: { category?: string; tag?: string; q?: string; featured?: boolean; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.tag) qs.set('tag', params.tag);
  if (params.q) qs.set('q', params.q);
  if (params.featured) qs.set('featured', 'true');
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return list<PublicArticleSummary>(`/public/articles${query ? `?${query}` : ''}`);
}

export const fetchArticle = (slug: string) => getJson<PublicArticleDetail>(`/public/articles/${enc(slug)}`);
export const fetchTimelines = () => list<PublicTimeline>('/public/timelines');
export const fetchTimeline = (slug: string) => getJson<PublicTimeline>(`/public/timelines/${enc(slug)}`);
export const fetchPublicTags = () => list<PublicTagWithCount>('/public/tags');
export const fetchLibraryLessons = () => list<PublicLibraryLesson>('/public/lessons');
export const fetchTopic = (slug: string) => getJson<PublicTopicDetail>(`/public/topics/${enc(slug)}`);
