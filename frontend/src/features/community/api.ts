import api, { extractErrorMessage } from '@/services/api';

export type CommunityPostType = 'QUICK_POST' | 'LONG_FORM';
export type CommunitySortMode = 'latest' | 'trending';

export interface SharedBlogEmbed {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
}

export interface CommunityPost {
  id: string;
  postType: CommunityPostType;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentBlocks: unknown;
  status: string;
  isFeatured: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  previewComment?: {
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
  } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    bio?: string | null;
    avatarUrl?: string | null;
    followerCount?: number;
    followedByMe?: boolean;
  } | null;
}

export interface CommunityMemberSummary {
  id: string;
  username: string;
  displayName: string;
  role?: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  totalLikesReceived?: number;
  totalCommentsReceived?: number;
  followedByMe: boolean;
  isMe?: boolean;
  followedAt?: string;
}

export interface CommunityMemberProfile {
  user: {
    id: string;
    username: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    bio: string | null;
    avatarUrl: string | null;
    joinedAt: string;
  };
  stats: {
    postCount: number;
    sharedBlogCount: number;
    questionPostCount: number;
    followerCount: number;
    followingCount: number;
    totalLikesReceived: number;
    totalCommentsReceived: number;
    totalViewsReceived: number;
  };
  topTopics: Array<{ tag: string; count: number }>;
  followedByMe: boolean;
  isMe: boolean;
  posts: CommunityPost[];
  bookmarkedPosts: CommunityPost[];
  followers: CommunityMemberSummary[];
  following: CommunityMemberSummary[];
}

export interface ParsedCommunityContent {
  paragraphs: string[];
  images: Array<{ url: string; caption?: string }>;
  tags: string[];
  period?: string;
  locations?: string;
  references: Array<{ title: string; source?: string; url?: string }>;
  sharedBlog?: SharedBlogEmbed | null;
}

const SSR_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000').replace(
  '://localhost',
  '://127.0.0.1',
);

const unwrap = <T,>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T;

export const FALLBACK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'seed-post-share-la-ma',
    postType: 'QUICK_POST',
    title: 'Mình vừa hoàn thiện bài chuyên khảo về kiến trúc cổng thành cổ đại, mời mọi người cùng đọc và góp ý!',
    slug: 'chia-se-bai-viet-cong-la-ma-va-khong-gian-quyen-luc',
    excerpt:
      'Góc nhìn đối chiếu giữa kiến trúc cổng khải hoàn La Mã và quy hoạch không gian thành lũy cổ đại. Rất mong nhận được thêm ý kiến phản biện từ các bạn yêu sử học.',
    coverImageUrl: null,
    contentBlocks: [
      {
        id: 'b1',
        type: 'paragraph',
        text: 'Góc nhìn đối chiếu giữa kiến trúc cổng khải hoàn La Mã và quy hoạch không gian thành lũy cổ đại. Rất mong nhận được thêm ý kiến phản biện từ các bạn yêu sử học.',
      },
      {
        id: 'meta',
        type: 'meta',
        kind: 'metadata',
        tags: ['Kiến trúc cổ đại', 'Chuyên khảo Blog', 'Quy hoạch thành thị'],
        period: 'Lịch sử Cổ đại',
        sharedBlog: {
          slug: 'cong-la-ma-va-khong-gian-quyen-luc',
          title: 'Cổng La Mã và không gian quyền lực',
          excerpt:
            'Từ cổng chiến thắng đến quy hoạch thành phố, kiến trúc La Mã biến các không gian công cộng thành lời tuyên ngôn quyền lực sống động.',
          coverImageUrl: 'https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg',
          authorName: 'Trần Minh Khôi',
        },
      },
    ],
    status: 'PUBLISHED',
    isFeatured: true,
    likeCount: 42,
    commentCount: 14,
    viewCount: 380,
    likedByMe: false,
    bookmarkedByMe: false,
    publishedAt: '2026-11-09T08:30:00.000Z',
    createdAt: '2026-11-09T08:30:00.000Z',
    updatedAt: '2026-11-09T08:30:00.000Z',
    author: { id: 'author-1', username: 'Trần Minh Khôi' },
  },
  {
    id: 'seed-post-van-mieu-bia-tien-si',
    postType: 'QUICK_POST',
    title: 'Vì sao bia Tiến sĩ khoa Nhâm Tuất (1442) lại được dựng muộn hơn 42 năm vào thời Hồng Đức?',
    slug: 'vi-sao-bia-tien-si-khoa-nham-tuat-1442-dung-nam-1484',
    excerpt:
      'Khoa thi đại tỉ năm Đại Bảo thứ 3 (1442) lấy đỗ 33 tiến sĩ, đứng đầu là Trạng nguyên Nguyễn Trực. Tuy nhiên phải đến năm Hồng Đức thứ 15 (1484), vua Lê Thánh Tông mới sai Thân Nhân Trung soạn bài ký khắc đá.',
    coverImageUrl: null,
    contentBlocks: [
      {
        id: 'b1',
        type: 'paragraph',
        text: 'Câu nói nổi tiếng "Hiền tài là nguyên khí của quốc gia" chính là nằm trên tấm bia đầu tiên này (soạn năm 1484 cho khoa thi năm 1442). Mọi người có tư liệu nào nói rõ về việc lưu giữ danh sách tiến sĩ trong 42 năm trước khi khắc bia không?',
      },
      {
        id: 'meta',
        type: 'meta',
        kind: 'metadata',
        tags: ['Lê Sơ', 'Bia Tiến sĩ', 'Thân Nhân Trung'],
        period: 'Thời Lê Sơ (1428–1527)',
        locations: 'Văn Miếu - Quốc Tử Giám, Hà Nội',
      },
    ],
    status: 'PUBLISHED',
    isFeatured: false,
    likeCount: 29,
    commentCount: 9,
    viewCount: 215,
    likedByMe: false,
    bookmarkedByMe: false,
    publishedAt: '2026-11-09T14:15:00.000Z',
    createdAt: '2026-11-09T14:15:00.000Z',
    updatedAt: '2026-11-09T14:15:00.000Z',
    author: { id: 'author-2', username: 'Lê Hoàng Nam' },
  },
  {
    id: 'seed-post-share-lang-nghe',
    postType: 'QUICK_POST',
    title: 'Chia sẻ lại bài viết về sự hình thành mạng lưới làng nghề thủ công ven đô thị cổ',
    slug: 'chia-se-bai-viet-lang-nghe-va-lich-su-bien-doi-khong-gian',
    excerpt:
      'Bài viết tổng hợp tư liệu về các phường hội thủ công và khu chợ truyền thống gắn với kinh thành xưa. Bấm vào thẻ bài viết bên dưới để đọc toàn văn trên Blog nhé!',
    coverImageUrl: null,
    contentBlocks: [
      {
        id: 'b1',
        type: 'paragraph',
        text: 'Bài viết tổng hợp tư liệu về các phường hội thủ công và khu chợ truyền thống gắn với kinh thành xưa. Bấm vào thẻ bài viết bên dưới để đọc toàn văn trên Blog nhé!',
      },
      {
        id: 'meta',
        type: 'meta',
        kind: 'metadata',
        tags: ['Làng nghề', 'Kinh tế cổ đại', 'Đô thị cổ'],
        period: 'Lịch sử Văn hóa - Kinh tế',
        sharedBlog: {
          slug: 'lang-nghe-va-lich-su-bien-doi-khong-gian',
          title: 'Làng nghề và lịch sử biến đổi không gian',
          excerpt:
            'Những khu chợ, xưởng thủ công và làng nghề đã hình thành nên mạng lưới văn hóa quanh các đô thị lớn.',
          coverImageUrl: 'https://res.cloudinary.com/demo/image/upload/cld-sample-4.jpg',
          authorName: 'Nguyễn Hà Phương',
        },
      },
    ],
    status: 'PUBLISHED',
    isFeatured: true,
    likeCount: 54,
    commentCount: 19,
    viewCount: 510,
    likedByMe: false,
    bookmarkedByMe: false,
    publishedAt: '2026-11-10T03:20:00.000Z',
    createdAt: '2026-11-10T03:20:00.000Z',
    updatedAt: '2026-11-10T03:20:00.000Z',
    author: { id: 'author-3', username: 'Nguyễn Hà Phương' },
  },
  {
    id: 'seed-post-thanh-nha-ho',
    postType: 'QUICK_POST',
    title: 'Kỹ thuật ghép đá nguyên khối nặng 20 tấn không dùng chất kết dính tại Thành Nhà Hồ (1397)?',
    slug: 'ky-thuat-ghep-da-thanh-nha-ho-1397',
    excerpt:
      'Chỉ trong vòng 3 tháng đầu năm Đinh Sửu (1397), Hồ Quý Ly đã đốc thúc xây dựng xong tòa thành đá Tây Đô tại Vĩnh Lộc (Thanh Hóa) với các phiến đá vôi mài phẳng khít tới mức lưỡi dao mỏng khó lọt qua.',
    coverImageUrl: null,
    contentBlocks: [
      {
        id: 'b1',
        type: 'paragraph',
        text: 'Các dấu vết công trường khai thác đá cổ tại núi An Tôn cách cổng Nam khoảng 2km cho thấy người xưa đã dùng nêm gỗ ngâm nước kết hợp hệ thống con lăn gỗ và đường trượt đất sét để vận chuyển các khối đá vôi khổng lồ.',
      },
      {
        id: 'meta',
        type: 'meta',
        kind: 'metadata',
        tags: ['Thành Nhà Hồ', 'Kiến trúc cổ', 'Nhà Hồ'],
        period: 'Cuối Trần - Hồ (1397-1407)',
        locations: 'Vĩnh Lộc, Thanh Hóa',
      },
    ],
    status: 'PUBLISHED',
    isFeatured: false,
    likeCount: 18,
    commentCount: 6,
    viewCount: 145,
    likedByMe: false,
    bookmarkedByMe: false,
    publishedAt: '2026-11-10T05:45:00.000Z',
    createdAt: '2026-11-10T05:45:00.000Z',
    updatedAt: '2026-11-10T05:45:00.000Z',
    author: { id: 'author-4', username: 'Phạm Quốc Đạt' },
  },
];

export function extractCommunityContent(post: CommunityPost): ParsedCommunityContent {
  const paragraphs: string[] = [];
  const images: Array<{ url: string; caption?: string }> = [];
  let tags: string[] = [];
  let period: string | undefined;
  let locations: string | undefined;
  let references: Array<{ title: string; source?: string; url?: string }> = [];
  let sharedBlog: SharedBlogEmbed | null = null;

  if (Array.isArray(post.contentBlocks)) {
    for (const raw of post.contentBlocks) {
      if (!raw || typeof raw !== 'object') continue;
      const block = raw as Record<string, any>;

      if (block.type === 'paragraph' && typeof block.text === 'string' && block.text.trim()) {
        paragraphs.push(block.text.trim());
      } else if (block.type === 'image' && typeof block.imageUrl === 'string' && block.imageUrl.trim()) {
        images.push({
          url: block.imageUrl.trim(),
          caption: typeof block.caption === 'string' ? block.caption.trim() : undefined,
        });
      } else if (block.type === 'meta' || block.kind === 'metadata') {
        const meta = (block.metadata && typeof block.metadata === 'object' ? block.metadata : block) as Record<
          string,
          any
        >;
        if (Array.isArray(meta.tags)) {
          tags = meta.tags
            .map((t: any) => (typeof t === 'string' ? t : t?.name || t?.value || ''))
            .map((t: string) => t.trim().replace(/^#/, ''))
            .filter(Boolean);
        }
        if (typeof meta.period === 'string' && meta.period.trim()) {
          period = meta.period.trim();
        }
        if (typeof meta.locations === 'string' && meta.locations.trim()) {
          locations = meta.locations.trim();
        }
        if (Array.isArray(meta.references)) {
          references = meta.references
            .filter((r: any) => r && typeof r === 'object' && r.title)
            .map((r: any) => ({
              title: String(r.title),
              source: r.source ? String(r.source) : undefined,
              url: r.url ? String(r.url) : undefined,
            }));
        }
        if (meta.sharedBlog && typeof meta.sharedBlog === 'object' && meta.sharedBlog.slug) {
          sharedBlog = {
            id: meta.sharedBlog.id ? String(meta.sharedBlog.id) : undefined,
            slug: String(meta.sharedBlog.slug),
            title: String(meta.sharedBlog.title || post.title),
            excerpt:
              typeof meta.sharedBlog.excerpt === 'string'
                ? meta.sharedBlog.excerpt
                : null,
            coverImageUrl:
              typeof meta.sharedBlog.coverImageUrl === 'string'
                ? meta.sharedBlog.coverImageUrl
                : null,
            authorName:
              typeof meta.sharedBlog.authorName === 'string'
                ? meta.sharedBlog.authorName
                : null,
          };
        }
      }
    }
  }

  // Nếu bản thân bản ghi là bài Blog chuyên khảo dài (LONG_FORM) xuất hiện trên Cộng đồng,
  // tự động hiển thị dưới dạng thẻ chia sẻ bài Blog kiểu Facebook (bấm vào chuyển sang /blog/[slug]).
  if (!sharedBlog && post.postType === 'LONG_FORM') {
    sharedBlog = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || paragraphs[0] || null,
      coverImageUrl: post.coverImageUrl || images[0]?.url || null,
      authorName: post.author?.username || 'Tác giả HISGO',
    };
  }

  return {
    paragraphs,
    images,
    tags,
    period,
    locations,
    references,
    sharedBlog,
  };
}

export async function fetchCommunityFeedSSR(params?: {
  type?: CommunityPostType;
  sort?: CommunitySortMode;
  limit?: number;
}): Promise<CommunityPost[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();

    const res = await fetch(`${SSR_API_URL}/posts${query ? `?${query}` : ''}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return FALLBACK_COMMUNITY_POSTS;
    }

    const body = await res.json();
    const list: CommunityPost[] = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    const visible = list.filter((p) => p.status !== 'REJECTED' && p.status !== 'REMOVED' && p.status !== 'ARCHIVED');
    return visible.length > 0 ? visible : FALLBACK_COMMUNITY_POSTS;
  } catch {
    return FALLBACK_COMMUNITY_POSTS;
  }
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 180);

const LOCAL_FOLLOWS_STORAGE_KEY = 'hisgo_community_follows_v1';
const LOCAL_PROFILE_BIO_STORAGE_KEY = 'hisgo_community_profile_bio_v1';

interface SeedMemberRecord {
  id: string;
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  joinedAt: string;
  followerIds: string[];
  followingIds: string[];
  extraPosts: CommunityPost[];
}

const SEED_COMMUNITY_MEMBERS: SeedMemberRecord[] = [
  {
    id: 'author-1',
    username: 'Trần Minh Khôi',
    displayName: 'Trần Minh Khôi',
    firstName: 'Trần Minh',
    lastName: 'Khôi',
    role: 'MODERATOR',
    bio: 'Nghiên cứu lịch sử kiến trúc thành lũy cổ đại, quy hoạch đô thị Đông Dương và khảo cổ học Hoàng thành Thăng Long.',
    avatarUrl: null,
    joinedAt: '2026-08-12T08:00:00.000Z',
    followerIds: ['author-2', 'author-3', 'author-4', 'author-5'],
    followingIds: ['author-2', 'author-3'],
    extraPosts: [
      {
        id: 'seed-post-khoi-2',
        postType: 'QUICK_POST',
        title: 'Đối chiếu cấu trúc gạch vồ thời Vĩnh Lạc và gạch bìa thời Lê Sơ tại khu khảo cổ 18 Hoàng Diệu',
        slug: 'doi-chieu-gach-vo-va-gach-bia-le-so-18-hoang-dieu',
        excerpt:
          'Qua kích thước và dấu in chữ Hán trên thành gạch tại hố khai quật khu A và khu B, có thể phân biệt rõ tầng văn hóa đầu thế kỷ XV với giai đoạn trùng tu thời Hồng Đức.',
        coverImageUrl: null,
        contentBlocks: [
          {
            id: 'b1',
            type: 'paragraph',
            text: 'Qua kích thước và dấu in chữ Hán trên thành gạch tại hố khai quật khu A và khu B, có thể phân biệt rõ tầng văn hóa đầu thế kỷ XV với giai đoạn trùng tu thời Hồng Đức.',
          },
          {
            id: 'meta',
            type: 'meta',
            kind: 'metadata',
            tags: ['Hoàng thành Thăng Long', 'Khảo cổ học', 'Kiến trúc cổ đại'],
            period: 'Thế kỷ XV',
            locations: 'Khu khảo cổ 18 Hoàng Diệu, Ba Đình, Hà Nội',
          },
        ],
        status: 'PUBLISHED',
        isFeatured: false,
        likeCount: 31,
        commentCount: 8,
        viewCount: 260,
        likedByMe: false,
        bookmarkedByMe: false,
        publishedAt: '2026-11-06T09:15:00.000Z',
        createdAt: '2026-11-06T09:15:00.000Z',
        updatedAt: '2026-11-06T09:15:00.000Z',
        author: { id: 'author-1', username: 'Trần Minh Khôi' },
      },
      {
        id: 'seed-post-khoi-3',
        postType: 'QUICK_POST',
        title: 'Tư liệu bản đồ cổ về hệ thống hào nước ngoại vi Kinh thành Thăng Long thế kỷ XVII',
        slug: 'tu-lieu-ban-do-co-he-thong-hao-nuoc-kinh-thanh-thang-long',
        excerpt:
          'Hệ thống sông Tô Lịch, sông Kim Ngưu và hồ Thủy Quân đóng vai trò vừa là tuyến giao thông thủy vừa là hào phòng thủ tự nhiên bao bọc lấy vòng thành Đại La.',
        coverImageUrl: null,
        contentBlocks: [
          {
            id: 'b1',
            type: 'paragraph',
            text: 'Hệ thống sông Tô Lịch, sông Kim Ngưu và hồ Thủy Quân đóng vai trò vừa là tuyến giao thông thủy vừa là hào phòng thủ tự nhiên bao bọc lấy vòng thành Đại La.',
          },
          {
            id: 'meta',
            type: 'meta',
            kind: 'metadata',
            tags: ['Hoàng thành Thăng Long', 'Quy hoạch thành thị', 'Bản đồ cổ'],
            period: 'Thời Lê Trung Hưng (Thế kỷ XVII)',
            locations: 'Kinh thành Thăng Long',
          },
        ],
        status: 'PUBLISHED',
        isFeatured: false,
        likeCount: 23,
        commentCount: 5,
        viewCount: 190,
        likedByMe: false,
        bookmarkedByMe: false,
        publishedAt: '2026-11-02T14:20:00.000Z',
        createdAt: '2026-11-02T14:20:00.000Z',
        updatedAt: '2026-11-02T14:20:00.000Z',
        author: { id: 'author-1', username: 'Trần Minh Khôi' },
      },
    ],
  },
  {
    id: 'author-2',
    username: 'Lê Hoàng Nam',
    displayName: 'Lê Hoàng Nam',
    firstName: 'Lê Hoàng',
    lastName: 'Nam',
    role: 'USER',
    bio: 'Quan tâm đến văn bia Hán Nôm, lịch sử khoa cử Nho học thời Lê Sơ và hệ thống di tích Văn Miếu - Quốc Tử Giám.',
    avatarUrl: null,
    joinedAt: '2026-09-03T10:30:00.000Z',
    followerIds: ['author-1', 'author-3', 'author-5'],
    followingIds: ['author-1', 'author-4'],
    extraPosts: [
      {
        id: 'seed-post-nam-2',
        postType: 'QUICK_POST',
        title: 'Thống kê số lượng tiến sĩ quê vùng Kinh Bắc qua 82 bia đá tại Văn Miếu',
        slug: 'thong-ke-tien-si-vung-kinh-bac-qua-82-bia-da-van-mieu',
        excerpt:
          'Xét theo đơn vị hành chính trấn Kinh Bắc xưa, các huyện Siêu Loại, Gia Bình, Lương Tài và Từ Sơn có mật độ đăng khoa dày đặc từ thời Hồng Đức đến thời Cảnh Hưng.',
        coverImageUrl: null,
        contentBlocks: [
          {
            id: 'b1',
            type: 'paragraph',
            text: 'Xét theo đơn vị hành chính trấn Kinh Bắc xưa, các huyện Siêu Loại, Gia Bình, Lương Tài và Từ Sơn có mật độ đăng khoa dày đặc từ thời Hồng Đức đến thời Cảnh Hưng.',
          },
          {
            id: 'meta',
            type: 'meta',
            kind: 'metadata',
            tags: ['Bia Tiến sĩ', 'Lê Sơ', 'Khoa cử Nho học'],
            period: 'Thời Lê (1442–1779)',
            locations: 'Văn Miếu - Quốc Tử Giám, Hà Nội',
          },
        ],
        status: 'PUBLISHED',
        isFeatured: false,
        likeCount: 19,
        commentCount: 6,
        viewCount: 164,
        likedByMe: false,
        bookmarkedByMe: false,
        publishedAt: '2026-11-04T11:00:00.000Z',
        createdAt: '2026-11-04T11:00:00.000Z',
        updatedAt: '2026-11-04T11:00:00.000Z',
        author: { id: 'author-2', username: 'Lê Hoàng Nam' },
      },
    ],
  },
  {
    id: 'author-3',
    username: 'Nguyễn Hà Phương',
    displayName: 'Nguyễn Hà Phương',
    firstName: 'Nguyễn Hà',
    lastName: 'Phương',
    role: 'MODERATOR',
    bio: 'Tìm hiểu lịch sử kinh tế - xã hội, mạng lưới thương cảng cổ và các phường hội thủ công truyền thống đồng bằng Bắc Bộ.',
    avatarUrl: null,
    joinedAt: '2026-08-25T15:00:00.000Z',
    followerIds: ['author-1', 'author-2', 'author-4'],
    followingIds: ['author-1', 'author-2', 'author-4'],
    extraPosts: [
      {
        id: 'seed-post-phuong-2',
        postType: 'QUICK_POST',
        title: 'Dấu tích gốm Chu Đậu thế kỷ XV trên các con tàu đắm cổ vùng biển Đông Nam Á',
        slug: 'dau-tich-gom-chu-dau-the-ky-xv-tren-tau-dam-co',
        excerpt:
          'Từ con tàu đắm Cù Lao Chàm với hơn 240.000 hiện vật, gốm hoa lam Chu Đậu (Nam Sách, Hải Dương) cho thấy quy mô xuất khẩu thủ công nghiệp Đại Việt thời Lê Thánh Tông.',
        coverImageUrl: null,
        contentBlocks: [
          {
            id: 'b1',
            type: 'paragraph',
            text: 'Từ con tàu đắm Cù Lao Chàm với hơn 240.000 hiện vật, gốm hoa lam Chu Đậu (Nam Sách, Hải Dương) cho thấy quy mô xuất khẩu thủ công nghiệp Đại Việt thời Lê Thánh Tông.',
          },
          {
            id: 'meta',
            type: 'meta',
            kind: 'metadata',
            tags: ['Làng nghề', 'Kinh tế cổ đại', 'Gốm Chu Đậu'],
            period: 'Thế kỷ XV - XVI',
            locations: 'Nam Sách, Hải Dương & Cù Lao Chàm, Quảng Nam',
          },
        ],
        status: 'PUBLISHED',
        isFeatured: false,
        likeCount: 27,
        commentCount: 7,
        viewCount: 230,
        likedByMe: false,
        bookmarkedByMe: false,
        publishedAt: '2026-11-05T16:40:00.000Z',
        createdAt: '2026-11-05T16:40:00.000Z',
        updatedAt: '2026-11-05T16:40:00.000Z',
        author: { id: 'author-3', username: 'Nguyễn Hà Phương' },
      },
    ],
  },
  {
    id: 'author-4',
    username: 'Phạm Quốc Đạt',
    displayName: 'Phạm Quốc Đạt',
    firstName: 'Phạm Quốc',
    lastName: 'Đạt',
    role: 'USER',
    bio: 'Đam mê khảo cứu kỹ thuật quân sự cổ đại, thành lũy đá thời Trần - Hồ và địa리 lịch sử vùng Thanh - Nghệ.',
    avatarUrl: null,
    joinedAt: '2026-09-18T09:10:00.000Z',
    followerIds: ['author-2', 'author-3'],
    followingIds: ['author-1', 'author-3'],
    extraPosts: [],
  },
  {
    id: 'author-5',
    username: 'Đặng Thu Trang',
    displayName: 'Đặng Thu Trang',
    firstName: 'Đặng Thu',
    lastName: 'Trang',
    role: 'USER',
    bio: 'Nghiên cứu trang phục cung đình, mỹ thuật điêu khắc đình làng thế kỷ XVII-XVIII và di sản tư liệu Châu bản triều Nguyễn.',
    avatarUrl: null,
    joinedAt: '2026-10-01T11:20:00.000Z',
    followerIds: ['author-1'],
    followingIds: ['author-1', 'author-2', 'author-3'],
    extraPosts: [],
  },
];

function getLocalFollowMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_FOLLOWS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function isLocallyFollowing(identifier: string): boolean | undefined {
  const map = getLocalFollowMap();
  const key = identifier.trim().toLowerCase();
  return map[key];
}

function setLocalFollowState(identifier: string, following: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalFollowMap();
    map[identifier.trim().toLowerCase()] = following;
    window.localStorage.setItem(LOCAL_FOLLOWS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage error
  }
}

function getLocalProfileBio(): { firstName?: string; lastName?: string; bio?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_BIO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocalProfileBio(payload: { firstName?: string; lastName?: string; bio?: string }) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalProfileBio() || {};
    window.localStorage.setItem(
      LOCAL_PROFILE_BIO_STORAGE_KEY,
      JSON.stringify({ ...existing, ...payload }),
    );
  } catch {
    // Ignore storage error
  }
}

function getPostsForSeedMember(member: SeedMemberRecord): CommunityPost[] {
  const fromMainFeed = FALLBACK_COMMUNITY_POSTS.filter(
    (p) =>
      p.author?.id === member.id ||
      p.author?.username.toLowerCase() === member.username.toLowerCase(),
  );
  return [...fromMainFeed, ...member.extraPosts];
}

export function getFallbackSuggestedMembers(): CommunityMemberSummary[] {
  const localMap = getLocalFollowMap();
  return SEED_COMMUNITY_MEMBERS.map((m) => {
    const posts = getPostsForSeedMember(m);
    const totalLikesReceived = posts.reduce((sum, p) => sum + p.likeCount, 0);
    const totalCommentsReceived = posts.reduce((sum, p) => sum + p.commentCount, 0);
    const localState =
      localMap[m.id.toLowerCase()] ?? localMap[m.username.toLowerCase()];
    const followedByMe = Boolean(localState);
    const followerCount = m.followerIds.length + (followedByMe ? 1 : 0);

    return {
      id: m.id,
      username: m.username,
      displayName: m.displayName,
      role: m.role,
      bio: m.bio,
      avatarUrl: m.avatarUrl,
      postCount: posts.length,
      followerCount,
      followingCount: m.followingIds.length,
      totalLikesReceived,
      totalCommentsReceived,
      followedByMe,
      isMe: false,
    };
  });
}

function mergeWithLocalFollowState(members: CommunityMemberSummary[]): CommunityMemberSummary[] {
  const localMap = getLocalFollowMap();
  return members.map((m) => {
    const override =
      localMap[m.id.toLowerCase()] ?? localMap[m.username.toLowerCase()];
    if (override === undefined || override === m.followedByMe) {
      return m;
    }
    const delta = override ? 1 : -1;
    return {
      ...m,
      followedByMe: override,
      followerCount: Math.max(0, m.followerCount + delta),
    };
  });
}

function applyLocalFollowAndBioToProfile(
  profile: CommunityMemberProfile,
): CommunityMemberProfile {
  const localMap = getLocalFollowMap();
  const override =
    localMap[profile.user.id.toLowerCase()] ??
    localMap[profile.user.username.toLowerCase()];
  const localBio = profile.isMe ? getLocalProfileBio() : null;

  let nextFollowedByMe = profile.followedByMe;
  let nextFollowers = mergeWithLocalFollowState(profile.followers);
  if (override !== undefined && override !== profile.followedByMe && !profile.isMe) {
    nextFollowedByMe = override;
  }

  const nextFollowing = mergeWithLocalFollowState(profile.following);
  const nextUser = localBio
    ? {
        ...profile.user,
        firstName: localBio.firstName ?? profile.user.firstName,
        lastName: localBio.lastName ?? profile.user.lastName,
        bio: localBio.bio ?? profile.user.bio,
        displayName:
          [
            localBio.firstName ?? profile.user.firstName,
            localBio.lastName ?? profile.user.lastName,
          ]
            .filter(Boolean)
            .join(' ')
            .trim() || profile.user.username,
      }
    : profile.user;

  return {
    ...profile,
    user: nextUser,
    followedByMe: nextFollowedByMe,
    followers: nextFollowers,
    following: nextFollowing,
    stats: {
      ...profile.stats,
      followerCount: nextFollowers.length,
      followingCount: nextFollowing.length,
    },
  };
}

function toggleLocalFollowFallback(identifier: string): {
  following: boolean;
  followerCount: number;
  targetUserId: string;
  targetUsername: string;
} {
  const clean = decodeURIComponent(identifier).trim();
  const target =
    SEED_COMMUNITY_MEMBERS.find(
      (m) =>
        m.id.toLowerCase() === clean.toLowerCase() ||
        m.username.toLowerCase() === clean.toLowerCase(),
    ) || SEED_COMMUNITY_MEMBERS[0];

  const current =
    isLocallyFollowing(target.id) ?? isLocallyFollowing(target.username) ?? false;
  const next = !current;
  setLocalFollowState(target.id, next);
  setLocalFollowState(target.username, next);

  const followerCount = target.followerIds.length + (next ? 1 : 0);
  return {
    following: next,
    followerCount,
    targetUserId: target.id,
    targetUsername: target.username,
  };
}

export function getFallbackCommunityProfile(
  identifier: string,
  forceIsMe = false,
): CommunityMemberProfile {
  const clean = decodeURIComponent(identifier || '').trim();
  const allSummaries = getFallbackSuggestedMembers();
  const summaryById = new Map(allSummaries.map((s) => [s.id, s]));

  const matched =
    SEED_COMMUNITY_MEMBERS.find(
      (m) =>
        m.id.toLowerCase() === clean.toLowerCase() ||
        m.username.toLowerCase() === clean.toLowerCase(),
    ) || SEED_COMMUNITY_MEMBERS[0];

  const isMe = forceIsMe || clean.toLowerCase() === 'me';
  const localBio = isMe ? getLocalProfileBio() : null;

  const posts = getPostsForSeedMember(matched);
  const postCount = posts.length;
  let sharedBlogCount = 0;
  let totalLikesReceived = 0;
  let totalCommentsReceived = 0;
  let totalViewsReceived = 0;
  const topicCounts = new Map<string, number>();

  for (const post of posts) {
    totalLikesReceived += post.likeCount;
    totalCommentsReceived += post.commentCount;
    totalViewsReceived += post.viewCount;
    const parsed = extractCommunityContent(post);
    if (parsed.sharedBlog) {
      sharedBlogCount += 1;
    }
    for (const tag of parsed.tags) {
      topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
    }
  }

  const questionPostCount = Math.max(0, postCount - sharedBlogCount);
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  const followedByMe = isMe
    ? false
    : Boolean(isLocallyFollowing(matched.id) ?? isLocallyFollowing(matched.username));

  const followers: CommunityMemberSummary[] = matched.followerIds
    .map((fid) => summaryById.get(fid))
    .filter((item): item is CommunityMemberSummary => Boolean(item));

  if (followedByMe) {
    followers.unshift({
      id: 'viewer-local',
      username: 'Bạn (Thành viên HISGO)',
      displayName: 'Bạn (Thành viên HISGO)',
      role: 'USER',
      bio: 'Thành viên đang theo dõi các thảo luận lịch sử trên HISGO.',
      avatarUrl: null,
      postCount: 1,
      followerCount: 1,
      followingCount: 1,
      followedByMe: false,
      isMe: true,
    });
  }

  const following: CommunityMemberSummary[] = matched.followingIds
    .map((fid) => summaryById.get(fid))
    .filter((item): item is CommunityMemberSummary => Boolean(item));

  // Kiểm tra tính toàn vẹn số liệu (Reconciliation assertions theo references/app-screens.md §2.1)
  console.assert(
    sharedBlogCount + questionPostCount === postCount,
    'Tổng bài chia sẻ Blog và câu hỏi thảo luận phải bằng tổng số bài viết',
  );
  console.assert(
    posts.reduce((acc, item) => acc + item.likeCount, 0) === totalLikesReceived,
    'Tổng lượt thích trên dải KPI phải khớp với tổng lượt thích của từng bài viết',
  );

  const firstName = localBio?.firstName ?? matched.firstName;
  const lastName = localBio?.lastName ?? matched.lastName;
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || matched.username;

  return {
    user: {
      id: matched.id,
      username: matched.username,
      displayName,
      firstName,
      lastName,
      role: matched.role,
      bio: localBio?.bio ?? matched.bio,
      avatarUrl: matched.avatarUrl,
      joinedAt: matched.joinedAt,
    },
    stats: {
      postCount,
      sharedBlogCount,
      questionPostCount,
      followerCount: followers.length,
      followingCount: following.length,
      totalLikesReceived,
      totalCommentsReceived,
      totalViewsReceived,
    },
    topTopics,
    followedByMe,
    isMe,
    posts,
    bookmarkedPosts: isMe ? FALLBACK_COMMUNITY_POSTS.slice(0, 2) : [],
    followers,
    following,
  };
}

export async function fetchSuggestedMembersSSR(limit = 5): Promise<CommunityMemberSummary[]> {
  try {
    const res = await fetch(`${SSR_API_URL}/posts/users/suggested?limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return getFallbackSuggestedMembers().slice(0, limit);
    }
    const body = await res.json();
    const list: CommunityMemberSummary[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];
    return list.length > 0 ? list.slice(0, limit) : getFallbackSuggestedMembers().slice(0, limit);
  } catch {
    return getFallbackSuggestedMembers().slice(0, limit);
  }
}

export async function fetchCommunityProfileSSR(
  identifier: string,
): Promise<CommunityMemberProfile> {
  const clean = decodeURIComponent(identifier || '').trim();
  if (!clean || clean.toLowerCase() === 'me') {
    return getFallbackCommunityProfile('author-1', true);
  }
  try {
    const encoded = encodeURIComponent(clean);
    const res = await fetch(`${SSR_API_URL}/posts/users/${encoded}/profile`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return getFallbackCommunityProfile(clean);
    }
    const body = await res.json();
    const profile: CommunityMemberProfile | null = body?.data ?? body ?? null;
    if (profile && profile.user?.id && profile.stats) {
      return profile;
    }
    return getFallbackCommunityProfile(clean);
  } catch {
    return getFallbackCommunityProfile(clean);
  }
}

export const CommunityApi = {
  async listPosts(params?: {
    type?: CommunityPostType;
    sort?: CommunitySortMode;
    cursor?: string;
    limit?: number;
    author?: string;
    followingOnly?: boolean;
  }): Promise<CommunityPost[]> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.cursor) qs.set('cursor', params.cursor);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.author) qs.set('author', params.author);
    if (params?.followingOnly) qs.set('followingOnly', 'true');
    const query = qs.toString();

    const res = await api.get(`/posts${query ? `?${query}` : ''}`);
    const list = unwrap<CommunityPost[]>(res);
    if (!Array.isArray(list)) return [];
    return list.filter((p) => p.status !== 'REJECTED' && p.status !== 'REMOVED' && p.status !== 'ARCHIVED');
  },

  async getSuggestedMembers(limit = 6): Promise<CommunityMemberSummary[]> {
    try {
      const res = await api.get(`/posts/users/suggested?limit=${limit}`);
      const list = unwrap<CommunityMemberSummary[]>(res);
      if (Array.isArray(list) && list.length > 0) {
        return mergeWithLocalFollowState(list);
      }
      return getFallbackSuggestedMembers().slice(0, limit);
    } catch {
      return getFallbackSuggestedMembers().slice(0, limit);
    }
  },

  async getCommunityProfile(identifier: string): Promise<CommunityMemberProfile> {
    try {
      const encoded = encodeURIComponent(identifier);
      const res = await api.get(`/posts/users/${encoded}/profile`);
      const profile = unwrap<CommunityMemberProfile>(res);
      if (profile && profile.user?.id) {
        return applyLocalFollowAndBioToProfile(profile);
      }
      return getFallbackCommunityProfile(identifier);
    } catch {
      return getFallbackCommunityProfile(identifier);
    }
  },

  async getMyCommunityProfile(): Promise<CommunityMemberProfile> {
    try {
      const res = await api.get('/posts/users/me/profile');
      const profile = unwrap<CommunityMemberProfile>(res);
      if (profile && profile.user?.id) {
        return applyLocalFollowAndBioToProfile(profile);
      }
      return getFallbackCommunityProfile('me', true);
    } catch {
      return getFallbackCommunityProfile('me', true);
    }
  },

  async updateMyCommunityProfile(payload: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<CommunityMemberProfile> {
    saveLocalProfileBio(payload);
    try {
      const res = await api.patch('/posts/users/me/profile', payload);
      const profile = unwrap<CommunityMemberProfile>(res);
      if (profile && profile.user?.id) {
        return applyLocalFollowAndBioToProfile(profile);
      }
      return getFallbackCommunityProfile('me', true);
    } catch {
      return getFallbackCommunityProfile('me', true);
    }
  },

  async toggleFollow(identifier: string): Promise<{
    following: boolean;
    followerCount: number;
    targetUserId: string;
    targetUsername: string;
  }> {
    try {
      const encoded = encodeURIComponent(identifier);
      const res = await api.post(`/posts/users/${encoded}/follow`);
      const data = unwrap<{
        following: boolean;
        followerCount: number;
        targetUserId: string;
        targetUsername: string;
      }>(res);
      setLocalFollowState(data.targetUsername || identifier, data.following);
      setLocalFollowState(data.targetUserId || identifier, data.following);
      return data;
    } catch {
      return toggleLocalFollowFallback(identifier);
    }
  },

  async listShareableBlogs(): Promise<SharedBlogEmbed[]> {
    try {
      const res = await api.get('/posts?limit=30');
      const list = unwrap<CommunityPost[]>(res);
      if (!Array.isArray(list)) return [];
      return list
        .filter((p) => p.status === 'PUBLISHED')
        .filter((p) => {
          const parsed = extractCommunityContent(p);
          // Chỉ lấy các bài Blog gốc (không lấy các bài ngắn chỉ là bản share lại)
          return p.postType === 'LONG_FORM' || !parsed.sharedBlog;
        })
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          coverImageUrl: p.coverImageUrl,
          authorName: p.author?.username || 'HISGO Blog',
        }));
    } catch {
      return [];
    }
  },

  async listMyBookmarks(): Promise<CommunityPost[]> {
    const res = await api.get('/posts/bookmarks/me');
    const list = unwrap<CommunityPost[]>(res);
    return Array.isArray(list) ? list : [];
  },

  async createQuickPost(payload: {
    title: string;
    content: string;
    imageUrl?: string | null;
    imageCaption?: string;
    tags?: string[];
    period?: string;
    authorId?: string;
    sharedBlog?: SharedBlogEmbed | null;
  }): Promise<CommunityPost> {
    const title = payload.title.trim();
    const content = payload.content.trim();
    const excerpt = content.length > 220 ? `${content.slice(0, 217)}...` : content;

    const contentBlocks: Record<string, any>[] = [
      {
        id: `paragraph-${Date.now()}`,
        type: 'paragraph',
        heading: '',
        text: content,
      },
    ];

    if (payload.imageUrl && !payload.sharedBlog) {
      contentBlocks.push({
        id: `image-${Date.now()}`,
        type: 'image',
        imageUrl: payload.imageUrl,
        caption: payload.imageCaption?.trim() || '',
      });
    }

    contentBlocks.push({
      id: 'blog-metadata',
      type: 'meta',
      kind: 'metadata',
      tags: payload.tags ?? [],
      period: payload.period?.trim() || '',
      references: [],
      ...(payload.sharedBlog ? { sharedBlog: payload.sharedBlog } : {}),
    });

    const res = await api.post('/posts', {
      authorId: payload.authorId,
      postType: 'QUICK_POST',
      title,
      slug: `${slugify(title || 'thao-luan-lich-su')}-${Date.now().toString(36)}`,
      excerpt,
      coverImageUrl: payload.sharedBlog ? undefined : payload.imageUrl || undefined,
      contentBlocks,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
    });

    return unwrap<CommunityPost>(res);
  },

  async toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const res = await api.post(`/posts/${postId}/like`);
    return unwrap<{ liked: boolean; likeCount: number }>(res);
  },

  async toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
    const res = await api.post(`/posts/${postId}/bookmark`);
    return unwrap<{ bookmarked: boolean }>(res);
  },

  async reportPost(postId: string, reason: string): Promise<{ success: boolean; reportId: string }> {
    try {
      const res = await api.post(`/posts/${postId}/report`, { reason });
      return unwrap<{ success: boolean; reportId: string }>(res);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Không thể gửi báo cáo bài viết.'));
    }
  },

  async incrementView(postId: string): Promise<void> {
    if (postId.startsWith('seed-post-')) return;
    try {
      await api.patch(`/posts/${postId}/view`);
    } catch {
      // Không chặn giao diện nếu lỗi mạng khi ghi nhận lượt xem
    }
  },
};
