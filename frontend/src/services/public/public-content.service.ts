/**
 * Đọc API công khai /public/* — dùng trong Server Component (fetch thuần, không axios/token).
 * Lỗi mạng / 404: danh sách trả [], chi tiết trả null — trang tự hiển thị trạng thái rỗng.
 *
 * Mọi nhãn niên đại (`dateLabel`) do backend tính sẵn (năm âm → "TCN"), frontend chỉ hiển thị.
 */

import { INTERNAL_API_BASE_URL } from '@/constants/api-url';

const API_URL = INTERNAL_API_BASE_URL;

export const CATEGORY_CANONICAL_ROUTES: Record<string, string> = {};

/** Slug 5 chuyên mục gốc mặc định của hệ thống HISGO. */
export const SYSTEM_CATEGORY_ROOT_SLUGS = {
  EVENT: 'su-kien',
  PERSON: 'nhan-vat',
  LOCATION: 'di-tich',
  DYNASTY: 'trieu-dai',
  DOCUMENT: 'tac-pham-tu-lieu',
} as const;

export interface CategoryHierarchyNode {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
}

/** Leo lên chuyên mục gốc (cấp 1, `parentId = null`) của 1 chuyên mục bất kỳ. */
export function findRootCategory<T extends CategoryHierarchyNode>(
  categories: T[],
  categoryId: string | null | undefined,
): T | undefined {
  if (!categoryId) return undefined;
  const byId = new Map(categories.map((c) => [c.id, c]));
  let cur = byId.get(categoryId);
  const seen = new Set<string>();
  while (cur?.parentId && byId.has(cur.parentId) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parentId);
  }
  return cur;
}

export interface EventCategoryItem extends CategoryHierarchyNode {
  parentId: string | null;
  description?: string | null;
  icon?: string | null;
  displayOrder?: number;
  parentSlug?: string | null;
  parentName?: string | null;
}

export interface EventCategoryRef {
  category?: string | null;
  categoryIds?: string[] | null;
}

const FALLBACK_EVENT_CATEGORY_LABEL = 'Khác';
const FALLBACK_EVENT_CATEGORY_KEY = 'OTHER';

/** Rút danh sách chuyên mục con thuộc nhánh Sự kiện (`su-kien`) kèm thông tin chuyên mục cha trực tiếp. */
export function extractEventCategories<
  T extends CategoryHierarchyNode & {
    parentId: string | null;
    description?: string | null;
    icon?: string | null;
    displayOrder?: number;
  },
>(categories: T[]): EventCategoryItem[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return categories
    .filter((c) => c.parentId && findRootCategory(categories, c.id)?.slug === SYSTEM_CATEGORY_ROOT_SLUGS.EVENT)
    .map((c) => {
      const parent = c.parentId ? byId.get(c.parentId) : undefined;
      return {
        id: c.id,
        parentId: c.parentId,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        icon: c.icon ?? null,
        displayOrder: c.displayOrder ?? 0,
        parentSlug: parent?.slug ?? null,
        parentName: parent?.name ?? null,
      };
    });
}

/** Khóa để gom / lọc theo loại sự kiện chính: ưu tiên id chuyên mục, sau đó tới slug. */
export const eventCategoryKey = (event: EventCategoryRef): string =>
  event.categoryIds?.[0] ?? event.category ?? '';

/** Tra nhãn hiển thị từ khóa (id hoặc slug) của loại sự kiện. */
export function categoryKeyLabel(categories: EventCategoryItem[], key: string): string {
  if (!key || key === FALLBACK_EVENT_CATEGORY_KEY) return FALLBACK_EVENT_CATEGORY_LABEL;
  return categories.find((c) => c.id === key || c.slug === key)?.name ?? key;
}

/** Nhãn hiển thị của loại sự kiện trên thẻ / danh sách. */
export function eventCategoryLabel(categories: EventCategoryItem[], event: EventCategoryRef): string {
  const id = event.categoryIds?.[0];
  if (id) {
    const byId = categories.find((c) => c.id === id);
    if (byId) return byId.name;
  }
  const slug = event.category ?? '';
  if (!slug || slug === FALLBACK_EVENT_CATEGORY_KEY) return FALLBACK_EVENT_CATEGORY_LABEL;
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}

export const PUBLIC_ROUTES = {
  ARTICLES: '/bai-viet',
  ARTICLE: (slug: string) => `/bai-viet/${slug}`,
  CATEGORY: (slug: string) => CATEGORY_CANONICAL_ROUTES[slug] ?? `/bai-viet?chuyen-muc=${encodeURIComponent(slug)}`,
  TIMELINES: '/dong-thoi-gian',
  /** Mỗi dòng thời gian hiển thị như 1 "thời kỳ" ở /giai-doan/[slug]. */
  TIMELINE: (slug: string) => `/giai-doan/${slug}`,
  LESSON: (slug: string) => `/bai-hoc/${slug}`,
  COMMUNITY: '/cong-dong',
  COMMUNITY_MEMBER: (username: string) => `/cong-dong/thanh-vien/${encodeURIComponent(username)}`,
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
  parentId?: string | null;
}

/**
 * Hồ sơ mô tả TÙY CHỌN (Article.metadata) — dữ liệu lịch sử lưu trong JSONB.
 */
export interface PersonProfileMeta {
  titles?: string[];
  roles?: string[];
  hometown?: string;
  backgroundAndYouth?: string;
  notableWorks?: string[];
  legacyAndHonors?: string;
  anecdotes?: string[];
  famousQuote?: string;
  milestones?: Array<{ year?: number; month?: number; day?: number; title: string; note?: string }>;
}

export interface SiteProfileMeta {
  address?: string;
  siteType?: string;
  recognizedYear?: string;
  preservation?: string;
  statusNote?: string;
  managingAgency?: string;
  architecturalStyle?: string;
}

export interface ArticleMetadata {
  aliases?: string[];
  sources?: string[];
  person?: PersonProfileMeta;
  site?: SiteProfileMeta;
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
  topicId: string | null;
  category: PublicCategoryRef | null;
  tags: PublicTag[];
}

export interface PublicArticleNeighbour {
  slug: string;
  title: string;
  dateLabel: string | null;
}

export interface PublicAuthorInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface PublicArticleDetail extends PublicArticleSummary {
  coverCaption: string | null;
  contentBlocks: unknown;
  author?: PublicAuthorInfo | null;
  publishedAt: string | null;
  updatedAt: string;
  timelines: Array<{ slug: string; title: string; nodeTitle: string }>;
  related: PublicArticleSummary[];
  previous: PublicArticleNeighbour | null;
  next: PublicArticleNeighbour | null;
  /** Bài trước / sau lấy theo Dòng thời gian này; null = cùng chuyên mục theo năm. */
  adjacentTimeline: { slug: string; title: string } | null;
}

export interface PublicCategory extends PublicCategoryRef {
  parentId: string | null;
  description: string | null;
  displayOrder: number;
  articleCount: number;
}

export interface PublicBlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentBlocks: unknown;
  status: string;
  isFeatured: boolean;
  viewCount?: number;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  author: { id: string; username: string } | null;
}

export interface PublicTimelineNodeArticle {
  id?: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  category: { name: string; slug: string; icon: string | null } | null;
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
  article: PublicTimelineNodeArticle | null;
  articles?: PublicTimelineNodeArticle[];
}

export interface PublicTimeline {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  topicId: string | null;
  /** Chủ đề gắn với dòng thời gian này (nếu có) — dùng để ráp cây Thời kỳ cha/con theo Topic. */
  topic: { id: string; name: string; slug: string; parentId: string | null } | null;
  nodes: PublicTimelineNode[];
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
export const fetchBlogPosts = () => list<PublicBlogPostSummary>('/public/blog');
export const fetchBlogPost = (slug: string) => getJson<PublicBlogPostSummary>(`/public/blog/${enc(slug)}`);
export const fetchTimelines = () => list<PublicTimeline>('/public/timelines');

/** Topic đã xuất bản, dạng phẳng — ráp cây qua `parentId`. Dùng để nhóm bài viết theo Chủ đề. */
export interface PublicTopicRef {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export const fetchTopics = () => list<PublicTopicRef>('/public/topics');
