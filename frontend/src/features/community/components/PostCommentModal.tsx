'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import {
  BookOpen,
  Clock,
  CornerDownRight,
  Edit3,
  ExternalLink,
  Heart,
  MapPin,
  MessageSquare,
  Send,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import {
  extractCommunityContent,
  type CommunityPost,
} from '../api';
import { API_BASE_URL } from '@/constants/api-url';
import { PostActionBar } from './PostActionBar';

const AUTHOR_TINTS = [
  { bg: '#E5EFE6', ink: '#1E4620' },
  { bg: '#F2E5C9', ink: '#6B4E16' },
  { bg: '#E3EEF5', ink: '#144E75' },
  { bg: '#F4E1DF', ink: '#7A1F24' },
];

function getAuthorTint(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AUTHOR_TINTS[hash % AUTHOR_TINTS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatVietnameseRelativeTime(iso?: string | null) {
  if (!iso) return 'Vừa xong';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export interface CommunityCommentItem {
  id: string;
  authorId?: string;
  authorName: string;
  authorBadge?: string;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  replies: CommunityCommentItem[];
}

type SortOrder = 'oldest' | 'newest' | 'popular';

/**
 * Kho bình luận lịch sử có sẵn từ trước cho các bài thảo luận mẫu và chuyên khảo
 * giúp khi bấm mở Popup luôn hiển thị đầy đủ mạch thảo luận của cộng đồng.
 */
const HISTORICAL_PRESET_COMMENTS: Record<string, CommunityCommentItem[]> = {
  'chia-se-bai-viet-cong-la-ma-va-khong-gian-quyen-luc': [
    {
      id: 'hist-c-lama-1',
      authorId: 'scholar-1',
      authorName: 'Đặng Quốc Huy',
      authorBadge: 'Nghiên cứu viên Kiến trúc cổ',
      content:
        'Bài chuyên khảo phân tích rất sâu sắc mối liên hệ giữa cổng khải hoàn La Mã (Triumphal Arch) và trục quy hoạch đô thị. Nếu đối chiếu với Ngọ Môn hay Đoan Môn tại Hoàng thành Thăng Long, ta cũng thấy tư duy lấy cổng thành làm tâm điểm nghi lễ triều đình.',
      createdAt: '2026-11-09T09:12:00.000Z',
      likes: 11,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-lama-1-r1',
          authorId: 'author-1',
          authorName: 'Trần Minh Khôi',
          authorBadge: 'Tác giả',
          content:
            'Cảm ơn anh Huy! Đúng là ở phương Đông, cổng thành không tách rời thành một vòm độc lập giữa quảng trường như La Mã mà gắn liền với lầu ngũ phụng và tường thành phòng thủ, nhưng hiệu ứng thị giác uy quyền thì rất tương đồng.',
          createdAt: '2026-11-09T09:40:00.000Z',
          likes: 6,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-lama-2',
      authorId: 'scholar-2',
      authorName: 'Vũ Thanh Mai',
      authorBadge: 'Thành viên Sử quán',
      content:
        'Mình rất ấn tượng phần giải thích về phù điêu kể chuyện chiến thắng khắc trên vòm cổng Titus và Constantine. Đối với cư dân cổ đại chưa biết chữ nhiều, kiến trúc cổng chính là một cuốn biên niên sử bằng đá ngoài trời.',
      createdAt: '2026-11-09T11:05:00.000Z',
      likes: 8,
      likedByMe: false,
      replies: [],
    },
    {
      id: 'hist-c-lama-3',
      authorId: 'scholar-3',
      authorName: 'Ngô Đình Bảo',
      content:
        'Không biết trong bài Blog bạn có đề cập thêm tới kỹ thuật vữa Pozzolana giúp vòm cuốn La Mã đứng vững qua hàng thiên niên kỷ không? Mình vừa bấm vào thẻ bài viết để đọc chi tiết!',
      createdAt: '2026-11-09T15:20:00.000Z',
      likes: 4,
      likedByMe: false,
      replies: [],
    },
  ],
  'vi-sao-bia-tien-si-khoa-nham-tuat-1442-dung-nam-1484': [
    {
      id: 'hist-c-bia-1',
      authorId: 'scholar-4',
      authorName: 'TS. Nguyễn Văn Thịnh',
      authorBadge: 'Chuyên gia Hán Nôm',
      content:
        'Theo Đại Việt sử ký toàn thư (Bản kỷ thực lục, quyển XI), ngay sau mỗi khoa thi đều có "Đăng khoa lục" ghi chép bằng giấy lưu tại bộ Lễ và Quốc Tử Giám. Do biến động chính trị giai đoạn Nghi Dân (1459) nên việc dựng bia đá bị trì hoãn tới thời Hồng Đức thịnh trị năm 1484 mới khắc đồng loạt.',
      createdAt: '2026-11-09T14:50:00.000Z',
      likes: 16,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-bia-1-r1',
          authorId: 'author-2',
          authorName: 'Lê Hoàng Nam',
          authorBadge: 'Tác giả',
          content:
            'Giải đáp quá chuẩn xác ạ! Nhờ có sổ Đăng khoa lục của bộ Lễ lưu trữ cẩn mật suốt 42 năm nên tên tuổi, quê quán của cả 33 vị tiến sĩ khoa Nhâm Tuất 1442 vẫn còn nguyên vẹn để Thân Nhân Trung soạn bài ký.',
          createdAt: '2026-11-09T15:18:00.000Z',
          likes: 7,
          likedByMe: false,
          replies: [],
        },
        {
          id: 'hist-c-bia-1-r2',
          authorId: 'scholar-5',
          authorName: 'Hoàng Minh Tuấn',
          content:
            'Bổ sung thêm là năm 1484 vua Lê Thánh Tông cho dựng một lúc 10 tấm bia tiến sĩ cho các khoa thi từ 1442 đến 1484, tạo thành quy chế dựng bia định kỳ sau mỗi khoa thi.',
          createdAt: '2026-11-09T16:02:00.000Z',
          likes: 5,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-bia-2',
      authorId: 'scholar-6',
      authorName: 'Phạm Thu Thủy',
      content:
        'Mỗi lần ghé Văn Miếu đọc lại bản dịch bài ký của Thân Nhân Trung trên tấm bia khoa Nhâm Tuất vẫn thấy lời văn vô cùng đanh thép: "Hiền tài là nguyên khí của quốc gia, nguyên khí thịnh thì thế nước mạnh mà vươn cao...".',
      createdAt: '2026-11-09T18:30:00.000Z',
      likes: 12,
      likedByMe: false,
      replies: [],
    },
  ],
  'chia-se-bai-viet-lang-nghe-va-lich-su-bien-doi-khong-gian': [
    {
      id: 'hist-c-langnghe-1',
      authorId: 'scholar-7',
      authorName: 'Lương Gia Khánh',
      authorBadge: 'Thành viên Sử quán',
      content:
        'Bài viết trên Blog tổng hợp rất rõ cấu trúc "ba mươi sáu phố phường" Kẻ Chợ gắn liền với các làng nghề gốc ở ven đô như gốm Bát Tràng, giấy Yên Thái, lụa Nghi Tàm, đúc đồng Ngũ Xã.',
      createdAt: '2026-11-10T04:10:00.000Z',
      likes: 14,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-langnghe-1-r1',
          authorId: 'author-3',
          authorName: 'Nguyễn Hà Phương',
          authorBadge: 'Tác giả',
          content:
            'Cảm ơn bạn Khánh đã đọc bài! Điểm thú vị nhất là thợ thủ công từ các làng quê di cư lên Kẻ Chợ nhưng vẫn giữ nguyên tục thờ Tổ nghề và lập đình vọng ngay tại phố nghề của mình.',
          createdAt: '2026-11-10T04:45:00.000Z',
          likes: 8,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-langnghe-2',
      authorId: 'scholar-8',
      authorName: 'Trịnh Hoài An',
      content:
        'Mình rất thích bản đồ đối chiếu mạng lưới sông Tô Lịch - sông Hồng với vị trí các bến chợ gốm và chợ tơ lụa trong bài viết. Giao thông thủy thực sự là mạch máu của kinh tế Thăng Long xưa.',
      createdAt: '2026-11-10T06:15:00.000Z',
      likes: 9,
      likedByMe: false,
      replies: [],
    },
  ],
  'ky-thuat-ghep-da-thanh-nha-ho-1397': [
    {
      id: 'hist-c-nhaho-1',
      authorId: 'scholar-9',
      authorName: 'KTS. Bùi Trọng Nghĩa',
      authorBadge: 'Nghiên cứu Bảo tồn Di sản',
      content:
        'Các cuộc khai quật tại núi đá An Tôn (Vĩnh Lộc, Thanh Hóa) đã tìm thấy những phiến đá vôi nặng hơn 20 tấn đang chế tác dở dang có hàng lỗ đục vuông thẳng hàng. Thợ đá thời Hồ đóng nêm gỗ khô vào lỗ rồi tưới nước cho gỗ nở ra để tách đá cực kỳ phẳng!',
      createdAt: '2026-11-10T06:20:00.000Z',
      likes: 15,
      likedByMe: false,
      replies: [
        {
          id: 'hist-c-nhaho-1-r1',
          authorId: 'author-4',
          authorName: 'Phạm Quốc Đạt',
          authorBadge: 'Tác giả',
          content:
            'Đúng vậy anh Nghĩa ơi! Ngoài con lăn gỗ và đường trượt đất sét, có giả thuyết cho rằng người xưa còn tận dụng mùa nước nổi trên sông Mã và sông Bưởi để chở đá bằng bè lớn áp sát chân thành.',
          createdAt: '2026-11-10T06:55:00.000Z',
          likes: 6,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: 'hist-c-nhaho-2',
      authorId: 'scholar-10',
      authorName: 'Đỗ Nhật Minh',
      content:
        'Một kỹ thuật đáng kinh ngạc nữa ở Cổng Nam Thành Nhà Hồ là phương pháp đắp cốt đất thành ụ vòm trước, xếp các phiến đá hình múi bưởi lên trên cho tự khóa chặt bằng trọng lực rồi mới đào bỏ phần đất bên dưới.',
      createdAt: '2026-11-10T07:40:00.000Z',
      likes: 10,
      likedByMe: false,
      replies: [],
    },
  ],
  'nghi-van-su-lieu-ve-bau-vat-thoi-tran': [
    {
      id: 'hist-c-tran-1',
      authorId: 'scholar-11',
      authorName: 'Phan Thanh Tùng',
      authorBadge: 'Khảo cổ học',
      content:
        'Đối với mảnh gốm men ngọc phát lộ tại khu vực Tức Mặc - Thiên Trường, hoa văn cúc dây in chìm dưới lớp men dày rất đặc trưng cho lò gốm Thiên Trường thế kỷ XIII–XIV, tuy nhiên cần đối chiếu thêm tầng văn hóa trước khi kết luận niên đại tuyệt đối.',
      createdAt: '2026-11-10T06:30:00.000Z',
      likes: 5,
      likedByMe: false,
      replies: [],
    },
    {
      id: 'hist-c-tran-2',
      authorId: 'scholar-12',
      authorName: 'Lê Minh Châu',
      content:
        'Mình đồng tình với hướng tiếp cận thận trọng, cần chờ báo cáo giám định nhiệt phát quang và so sánh với sưu tập gốm thời Trần tại Hoàng thành Thăng Long.',
      createdAt: '2026-11-10T07:10:00.000Z',
      likes: 3,
      likedByMe: false,
      replies: [],
    },
  ],
};

export function getPresetCommentsForPost(post: CommunityPost): CommunityCommentItem[] {
  if (HISTORICAL_PRESET_COMMENTS[post.slug]) {
    return HISTORICAL_PRESET_COMMENTS[post.slug];
  }

  const parsed = extractCommunityContent(post);
  if (parsed.sharedBlog?.slug && HISTORICAL_PRESET_COMMENTS[parsed.sharedBlog.slug]) {
    return HISTORICAL_PRESET_COMMENTS[parsed.sharedBlog.slug];
  }

  const authorName = post.author?.username || 'Thành viên HISGO';
  return [
    {
      id: `hist-default-1-${post.id}`,
      authorId: 'scholar-default-1',
      authorName: 'Nguyễn Minh Triết',
      authorBadge: 'Thành viên Sử quán',
      content: `Chủ đề "${post.title}" rất đáng chú ý. Theo các nguồn tư liệu thư tịch cổ và kết quả khảo cổ gần đây, việc đối chiếu đa chiều giữa chính sử và bi ký địa phương sẽ giúp làm sáng tỏ nhiều chi tiết quan trọng.`,
      createdAt: post.publishedAt || post.createdAt || '2026-11-09T10:00:00.000Z',
      likes: 5,
      likedByMe: false,
      replies: [
        {
          id: `hist-default-1-r1-${post.id}`,
          authorId: post.author?.id || 'author-default',
          authorName,
          authorBadge: 'Tác giả',
          content:
            'Cảm ơn bạn đã góp ý! Mình cũng đang tổng hợp thêm các nguồn tư liệu bi ký để bổ sung vào mạch thảo luận này.',
          createdAt: post.publishedAt || post.createdAt || '2026-11-09T10:35:00.000Z',
          likes: 3,
          likedByMe: false,
          replies: [],
        },
      ],
    },
    {
      id: `hist-default-2-${post.id}`,
      authorId: 'scholar-default-2',
      authorName: 'Trần Thu Hà',
      content:
        'Cảm ơn tác giả đã đặt câu hỏi gợi mở trên diễn đàn cộng đồng. Mình đã lưu lại bài viết để tiện theo dõi các ý kiến phân tích tiếp theo.',
      createdAt: post.publishedAt || post.createdAt || '2026-11-09T11:20:00.000Z',
      likes: 2,
      likedByMe: false,
      replies: [],
    },
  ];
}

function mapBackendCommentsToTree(rawComments: any[]): CommunityCommentItem[] {
  const map = new Map<string, CommunityCommentItem>();
  const roots: CommunityCommentItem[] = [];

  rawComments.forEach((c) => {
    map.set(c.id, {
      id: c.id,
      authorId: c.author?.id || c.authorId,
      authorName: c.author?.username || c.authorName || 'Thành viên HISGO',
      content: c.content,
      createdAt: c.createdAt || new Date().toISOString(),
      likes: typeof c.likesCount === 'number' ? c.likesCount : typeof c.likes === 'number' ? c.likes : 0,
      likedByMe: Boolean(c.likedByMe),
      replies: [],
    });
  });

  rawComments.forEach((c) => {
    const node = map.get(c.id);
    if (!node) return;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function countAllCommentsInTree(items: CommunityCommentItem[]): number {
  return items.reduce(
    (sum, item) => sum + 1 + countAllCommentsInTree(item.replies || []),
    0,
  );
}

interface PostCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: CommunityPost;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
  onCommentAdded?: (
    postId: string,
    totalComments: number,
    latestComment?: { id: string; authorName: string; content: string; createdAt: string },
  ) => void;
}

export function PostCommentModal({
  isOpen,
  onClose,
  post,
  onLikeUpdate,
  onBookmarkUpdate,
  onCommentAdded,
}: PostCommentModalProps) {
  const user = useAuthSession();
  const currentUserName = user?.username || 'Bạn đọc HISGO';
  const currentUserId = user?.id || 'guest-user';

  const storageKey = useMemo(() => `hisgo_community_modal_comments_v2:${post.id}`, [post.id]);

  const [comments, setComments] = useState<CommunityCommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('oldest');

  const [composerText, setComposerText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [imgError, setImgError] = useState(false);
  const [sharedImgError, setSharedImgError] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const authorName = post.author?.username || 'Thành viên HISGO';
  const authorTint = getAuthorTint(authorName);
  const parsed = extractCommunityContent(post);
  const sharedBlog = parsed.sharedBlog ?? null;

  const rawPrimaryImage = !sharedBlog
    ? post.coverImageUrl || parsed.images[0]?.url || null
    : null;
  const primaryImage =
    !imgError && rawPrimaryImage && !rawPrimaryImage.includes('cld-sample-6.jpg')
      ? rawPrimaryImage
      : null;
  const primaryCaption = parsed.images[0]?.caption;

  const sharedCoverImage =
    !sharedImgError &&
    sharedBlog?.coverImageUrl &&
    !sharedBlog.coverImageUrl.includes('cld-sample-6.jpg')
      ? sharedBlog.coverImageUrl
      : null;

  // Khóa cuộn trang nền và lắng nghe phím Escape khi mở Popup
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Tải danh sách các bình luận từ trước (kết hợp API + dữ liệu thảo luận trước đó + localStorage)
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadComments = async () => {
      setIsLoadingComments(true);

      // 1. Đọc bản lưu localStorage nếu người dùng đã tương tác trước đó
      let storedList: CommunityCommentItem[] | null = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const parsedJson = JSON.parse(raw);
            if (Array.isArray(parsedJson) && parsedJson.length > 0) {
              storedList = parsedJson;
            }
          }
        } catch {
          // Bỏ qua lỗi đọc localStorage
        }
      }

      const presetList = getPresetCommentsForPost(post);

      // 2. Thử lấy bình luận thực từ Backend nếu không phải seed ID giả lập
      let apiTree: CommunityCommentItem[] = [];
      if (!post.id.startsWith('seed-post-')) {
        try {
          const res = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
            credentials: 'include',
          });
          if (res.ok) {
            const json = await res.json();
            const rawData = json?.data ?? json;
            if (Array.isArray(rawData) && rawData.length > 0) {
              apiTree = mapBackendCommentsToTree(rawData);
            }
          }
        } catch {
          // Dùng dữ liệu dự phòng nếu lỗi kết nối
        }
      }

      if (cancelled) return;

      // Gộp bình luận từ trước để đảm bảo khi bấm mở Popup luôn có đầy đủ bình luận trước đó
      let merged: CommunityCommentItem[];
      if (storedList && storedList.length > 0) {
        const existingIds = new Set(storedList.map((item) => item.id));
        const extraFromApi = apiTree.filter((item) => !existingIds.has(item.id));
        merged = [...storedList, ...extraFromApi];
      } else if (apiTree.length > 0) {
        const apiIds = new Set(apiTree.map((item) => item.id));
        const presetToKeep = presetList.filter((item) => !apiIds.has(item.id));
        merged = [...presetToKeep, ...apiTree];
      } else {
        merged = presetList;
      }

      setComments(merged);
      setIsLoadingComments(false);
    };

    void loadComments();

    // Kết nối Socket.io nhận bình luận mới theo thời gian thực
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });
    socket.emit('join-post-room', { postId: post.id });

    socket.on('post:comment-added', (payload: any) => {
      const newComment = payload?.comment ?? payload;
      if (!newComment?.id) return;
      setComments((prev) => {
        const mapped: CommunityCommentItem = {
          id: newComment.id,
          authorId: newComment.author?.id || newComment.authorId,
          authorName: newComment.author?.username || newComment.authorName || 'Thành viên HISGO',
          content: newComment.content,
          createdAt: newComment.createdAt || new Date().toISOString(),
          likes: newComment.likesCount || 0,
          likedByMe: false,
          replies: [],
        };

        if (newComment.parentId) {
          return prev.map((c) => {
            if (c.id !== newComment.parentId) return c;
            if (c.replies.some((r) => r.id === mapped.id)) return c;
            return { ...c, replies: [...c.replies, mapped] };
          });
        }

        if (prev.some((c) => c.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
    });

    return () => {
      cancelled = true;
      socket.emit('leave-post-room', { postId: post.id });
      socket.disconnect();
    };
  }, [isOpen, post, storageKey]);

  // Lưu thay đổi bình luận vào localStorage để giữ bền vững giữa các lần mở Popup
  const persistComments = (nextComments: CommunityCommentItem[]) => {
    setComments(nextComments);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextComments));
      } catch {
        // Bỏ qua lỗi quota
      }
    }
  };

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortOrder === 'newest') {
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    if (sortOrder === 'popular') {
      return list.sort((a, b) => b.likes + b.replies.length * 2 - (a.likes + a.replies.length * 2));
    }
    // Mặc định hiển thị các bình luận từ trước theo trình tự thời gian giống Facebook
    return list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [comments, sortOrder]);

  const totalCommentCount = useMemo(() => {
    const counted = countAllCommentsInTree(comments);
    return Math.max(post.commentCount, counted);
  }, [comments, post.commentCount]);

  const handleSelectReply = (commentId: string, targetAuthorName: string) => {
    setReplyingTo({ commentId, authorName: targetAuthorName });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
  };

  const handleToggleLikeComment = async (commentId: string) => {
    const next = comments.map((item) => {
      if (item.id === commentId) {
        const nextLiked = !item.likedByMe;
        return {
          ...item,
          likedByMe: nextLiked,
          likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)),
        };
      }
      if (item.replies.some((r) => r.id === commentId)) {
        return {
          ...item,
          replies: item.replies.map((r) => {
            if (r.id !== commentId) return r;
            const nextLiked = !r.likedByMe;
            return {
              ...r,
              likedByMe: nextLiked,
              likes: Math.max(0, r.likes + (nextLiked ? 1 : -1)),
            };
          }),
        };
      }
      return item;
    });

    persistComments(next);

    if (!commentId.startsWith('hist-') && !commentId.startsWith('local-')) {
      try {
        const token = PublicAuthService.getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        await fetch(`${API_BASE_URL}/posts/${post.id}/comments/${commentId}/like`, {
          method: 'POST',
          headers,
          credentials: 'include',
        });
      } catch {
        // Giữ cập nhật optimistic trên giao diện
      }
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = composerText.trim();
    if (!trimmed) return;

    const nowIso = new Date().toISOString();
    const newItem: CommunityCommentItem = {
      id: `local-${Date.now()}`,
      authorId: currentUserId,
      authorName: currentUserName,
      authorBadge: currentUserId === post.author?.id ? 'Tác giả' : undefined,
      content: trimmed,
      createdAt: nowIso,
      likes: 0,
      likedByMe: false,
      replies: [],
    };

    const parentCommentId = replyingTo?.commentId || null;

    let nextComments: CommunityCommentItem[];
    if (parentCommentId) {
      nextComments = comments.map((c) =>
        c.id === parentCommentId ? { ...c, replies: [...c.replies, newItem] } : c,
      );
    } else {
      nextComments = [...comments, newItem];
    }

    persistComments(nextComments);
    setComposerText('');
    setReplyingTo(null);

    const updatedTotal = Math.max(post.commentCount + 1, countAllCommentsInTree(nextComments));
    onCommentAdded?.(post.id, updatedTotal, {
      id: newItem.id,
      authorName: newItem.authorName,
      content: newItem.content,
      createdAt: newItem.createdAt,
    });

    if (!parentCommentId) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }

    // Gửi lên Backend nếu bài viết có trong CSDL
    if (!post.id.startsWith('seed-post-')) {
      try {
        const token = PublicAuthService.getAccessToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            content: trimmed,
            parentId:
              parentCommentId &&
              !parentCommentId.startsWith('hist-') &&
              !parentCommentId.startsWith('local-')
                ? parentCommentId
                : undefined,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const saved = json?.data ?? json;
          if (saved?.id) {
            const synced = nextComments.map((c) => {
              if (c.id === newItem.id) return { ...c, id: saved.id };
              return {
                ...c,
                replies: c.replies.map((r) => (r.id === newItem.id ? { ...r, id: saved.id } : r)),
              };
            });
            persistComments(synced);
          }
        }
      } catch {
        // Đã lưu vào localStorage
      }
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    const next = comments.map((c) => {
      if (c.id === commentId) return { ...c, content: trimmed };
      return {
        ...c,
        replies: c.replies.map((r) => (r.id === commentId ? { ...r, content: trimmed } : r)),
      };
    });

    persistComments(next);
    setEditingId(null);
    setEditingText('');

    if (!commentId.startsWith('hist-') && !commentId.startsWith('local-')) {
      try {
        const token = PublicAuthService.getAccessToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        await fetch(`${API_BASE_URL}/posts/${post.id}/comments/${commentId}`, {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: JSON.stringify({ content: trimmed }),
        });
      } catch {
        // Giữ bản sửa tại localStorage
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const next = comments
      .filter((c) => c.id !== commentId)
      .map((c) => ({
        ...c,
        replies: c.replies.filter((r) => r.id !== commentId),
      }));

    persistComments(next);
    const updatedTotal = countAllCommentsInTree(next);
    onCommentAdded?.(post.id, updatedTotal);

    if (!commentId.startsWith('hist-') && !commentId.startsWith('local-')) {
      try {
        const token = PublicAuthService.getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        await fetch(`${API_BASE_URL}/posts/${post.id}/comments/${commentId}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });
      } catch {
        // Giữ trạng thái đã xóa trên client
      }
    }
  };

  if (!isOpen) return null;

  const currentUserTint = getAuthorTint(currentUserName);

  const renderCommentNode = (item: CommunityCommentItem, isReply = false, parentId?: string) => {
    const tint = getAuthorTint(item.authorName);
    const isMine =
      item.authorId === currentUserId ||
      item.authorName.toLowerCase() === currentUserName.toLowerCase();
    const isEditing = editingId === item.id;

    return (
      <div key={item.id} className="group">
        <div className="flex items-start gap-3">
          {/* Avatar người bình luận */}
          <div
            style={{ backgroundColor: tint.bg, color: tint.ink }}
            className={` flex shrink-0 items-center justify-center rounded-full font-semibold ${
              isReply ? 'h-8 w-8 text-[12px]' : 'h-9 w-9 text-[13px]'
            }`}
          >
            {getInitials(item.authorName)}
          </div>

          <div className="min-w-0 flex-1">
            {/* Bong bóng bình luận kiểu Facebook trên nền giấy dó ấm */}
            <div className="relative inline-block max-w-full rounded-[14px] border border-[#E2D5BC] bg-[#F2E8D5] px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-[#14233F]">{item.authorName}</span>
                {item.authorBadge ? (
                  <span
                    className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold ${
                      item.authorBadge === 'Tác giả'
                        ? 'bg-[#7A1F24]/12 text-[#7A1F24]'
                        : 'bg-[#E5DAC4] text-[#5C4E3C]'
                    }`}
                  >
                    {item.authorBadge}
                  </span>
                ) : null}
              </div>

              {isEditing ? (
                <div className="mt-2 min-w-[260px] space-y-2 sm:min-w-[380px]">
                  <textarea
                    rows={2}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full rounded-[8px] border border-[#D8C8AA] bg-[#FDF9F0] px-3 py-2 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingText('');
                      }}
                      className="rounded-[5px] px-2.5 py-1 text-[12px] font-medium text-[#6E5D4B] hover:text-[#14233F]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit(item.id)}
                      className="rounded-[5px] bg-[#7A1F24] px-3 py-1 text-[12px] font-semibold text-[#FAF5E6] hover:bg-[#651A1E]"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-line break-words text-[14px] leading-[1.6] text-[#2B241D]">
                  {item.content}
                </p>
              )}

              {/* Huy hiệu lượt thích nổi ở góc phải dưới bong bóng giống Facebook */}
              {item.likes > 0 && !isEditing ? (
                <button
                  type="button"
                  onClick={() => void handleToggleLikeComment(item.id)}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#D8C8AA] bg-[#FDF9F0] px-2 py-0.5 text-[11px] font-semibold text-[#7A1F24] tabular-nums"
                >
                  <Heart size={11} className="fill-[#7A1F24] text-[#7A1F24]" />
                  <span>{item.likes}</span>
                </button>
              ) : null}
            </div>

            {/* Thanh tác vụ dưới bong bóng: Thích · Phản hồi · Sửa · Xóa · Thời gian */}
            <div className="mt-1 flex flex-wrap items-center gap-3.5 pl-2 text-[12px]">
              <button
                type="button"
                onClick={() => void handleToggleLikeComment(item.id)}
                className={`font-semibold transition-colors ${
                  item.likedByMe
                    ? 'text-[#7A1F24]'
                    : 'text-[#6E5D4B] hover:text-[#14233F] hover:underline'
                }`}
              >
                {item.likedByMe ? 'Đã thích' : 'Thích'}
              </button>

              <button
                type="button"
                onClick={() => handleSelectReply(parentId || item.id, item.authorName)}
                className="font-semibold text-[#6E5D4B] transition-colors hover:text-[#14233F] hover:underline"
              >
                Phản hồi
              </button>

              {isMine && !isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingText(item.content);
                    }}
                    className="inline-flex items-center gap-1 font-medium text-[#6E5D4B] hover:text-[#14233F]"
                  >
                    <Edit3 size={11} />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteComment(item.id)}
                    className="inline-flex items-center gap-1 font-medium text-[#7A1F24]/80 hover:text-[#7A1F24]"
                  >
                    <Trash2 size={11} />
                    <span>Xóa</span>
                  </button>
                </>
              ) : null}

              <span className="text-[#8A7963]">
                {formatVietnameseRelativeTime(item.createdAt)}
              </span>
            </div>

            {/* Danh sách phản hồi lồng bên trong */}
            {item.replies && item.replies.length > 0 ? (
              <div className="mt-3 space-y-3 border-l-2 border-[#DFD1B8] pl-3.5 sm:pl-4">
                {item.replies.map((reply) => renderCommentNode(reply, true, item.id))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14233F]/65 p-2.5 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-post-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-[740px] flex-col overflow-hidden rounded-[10px] border border-[#D8C8AA] bg-[#FAF5E6] text-[#14233F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Thanh tiêu đề cố định trên cùng kiểu Popup Facebook */}
        <header className="relative flex shrink-0 items-center justify-between bg-[#F1E6D0] px-5 py-3.5">
          <div className="w-9 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-center">
            <h2
              id="community-post-modal-title"
              className="truncate text-[16px] font-bold text-[#14233F] md:text-[17px]"
            >
              Bài viết của {authorName}
            </h2>
            <p className="text-[12px] text-[#6E5D4B] tabular-nums">
              {totalCommentCount} bình luận trong cuộc thảo luận
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ bình luận"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D8C8AA] bg-[#FAF5E6] text-[#14233F] transition-colors hover:border-[#7A1F24] hover:bg-[#FDF9F0] hover:text-[#7A1F24]"
          >
            <X size={18} />
          </button>
        </header>

        {/* 2. Vùng cuộn giữa: Nội dung bài đăng + Toàn bộ bình luận từ trước */}
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {/* Phần tóm tắt bài viết gốc ngay đầu Popup */}
          <div className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: authorTint.bg, color: authorTint.ink }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                >
                  {getInitials(authorName)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#14233F]">{authorName}</span>
                    {sharedBlog ? (
                      <span className="text-[13px] text-[#5C4E3C]">
                        đã chia sẻ bài chuyên khảo từ <strong>HISGO Blog</strong>
                      </span>
                    ) : null}
                    <span className="text-[12px] text-[#7A6B57]">·</span>
                    <span className="text-[12px] text-[#7A6B57]">
                      {formatVietnameseRelativeTime(post.publishedAt || post.createdAt)}
                    </span>
                  </div>

                  {(parsed.period || parsed.locations) && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[12px] text-[#6E5D4B]">
                      {parsed.period ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          <span>{parsed.period}</span>
                        </span>
                      ) : null}
                      {parsed.locations ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{parsed.locations}</span>
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`inline-flex h-6 items-center gap-1 rounded-[5px] px-2.5 text-[11px] font-semibold ${
                  sharedBlog ? 'bg-[#F2E5C9] text-[#6B4E16]' : 'bg-[#E5EFE6] text-[#1E4620]'
                }`}
              >
                {sharedBlog ? (
                  <>
                    <Share2 size={11} />
                    <span>Chia sẻ bài Blog</span>
                  </>
                ) : (
                  <span>Câu hỏi / Thảo luận ngắn</span>
                )}
              </span>
            </div>

            {/* Nội dung câu hỏi / lời dẫn */}
            <div className="mt-3.5">
              <h3 className="text-[17px] font-bold leading-snug text-[#14233F] md:text-[19px]">
                {post.title}
              </h3>

              {parsed.paragraphs.length > 0 ? (
                <div className="mt-2 space-y-2.5 text-[14px] leading-[1.7] text-[#4A3F33]">
                  {parsed.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              ) : post.excerpt && post.excerpt !== post.title ? (
                <p className="mt-2 text-[14px] leading-[1.7] text-[#4A3F33]">{post.excerpt}</p>
              ) : null}
            </div>

            {/* Thẻ chia sẻ bài Blog kiểu Facebook bên trong Popup */}
            {sharedBlog ? (
              <Link
                href={`/blog/${sharedBlog.slug}`}
                onClick={onClose}
                className="group mt-3.5 block overflow-hidden rounded-[8px] border border-[#D8C8AA] bg-[#F4ECDA] transition-colors hover:border-[#8A5A19]"
              >
                {sharedCoverImage ? (
                  <div className="relative aspect-[16/8] max-h-[260px] w-full overflow-hidden bg-[#EADBC0]">
                    <img
                      src={sharedCoverImage}
                      alt={sharedBlog.title}
                      onError={() => setSharedImgError(true)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-[4px] bg-[#14233F]/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FAF5E6]">
                      <BookOpen size={11} />
                      <span>HISGO BLOG</span>
                    </span>
                  </div>
                ) : null}
                <div className="p-3.5 md:p-4">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A5A19]">
                    <span>
                      HISGO.VN/BLOG ·{' '}
                      {sharedBlog.authorName ? `TÁC GIẢ: ${sharedBlog.authorName}` : 'CHUYÊN KHẢO'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#7A1F24] group-hover:underline">
                      <span>Đọc trên Blog</span>
                      <ExternalLink size={11} />
                    </span>
                  </div>
                  <h4 className="mt-1 text-[16px] font-bold text-[#14233F] group-hover:text-[#7A1F24]">
                    {sharedBlog.title}
                  </h4>
                  {sharedBlog.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-[13px] text-[#5C4E3C]">
                      {sharedBlog.excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            ) : null}

            {/* Ảnh đính kèm bài ngắn nếu có */}
            {primaryImage ? (
              <figure className="mt-3.5 overflow-hidden rounded-[8px] border border-[#E5DAC4] bg-[#F2E8D5]">
                <img
                  src={primaryImage}
                  alt={primaryCaption || post.title}
                  onError={() => setImgError(true)}
                  className="max-h-[360px] w-full object-cover"
                />
                {primaryCaption ? (
                  <figcaption className="bg-[#EFE4CF] px-3.5 py-2 text-[12px] text-[#6E5D4B]">
                    Nguồn / Chú thích: {primaryCaption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <PostActionBar
              postId={post.id}
              postTitle={post.title}
              likeCount={post.likeCount}
              commentCount={totalCommentCount}
              viewCount={post.viewCount}
              likedByMe={post.likedByMe}
              bookmarkedByMe={post.bookmarkedByMe}
              commentsOpen={true}
              onToggleComments={() => inputRef.current?.focus()}
              onLikeUpdate={onLikeUpdate}
              onBookmarkUpdate={onBookmarkUpdate}
            />
          </div>

          {/* Dải tiêu đề khu vực bình luận & bộ lọc sắp xếp */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-[#F1E6D0] px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#7A1F24]" />
              <span className="text-[14px] font-bold text-[#14233F]">
                Các bình luận trước đó ({totalCommentCount})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="text-[#6E5D4B]">Hiển thị:</span>
              {(
                [
                  { key: 'oldest', label: 'Từ trước đến nay' },
                  { key: 'popular', label: 'Phù hợp nhất' },
                  { key: 'newest', label: 'Mới nhất' },
                ] as Array<{ key: SortOrder; label: string }>
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSortOrder(opt.key)}
                  className={`rounded-[5px] px-2.5 py-1 font-semibold transition-colors ${
                    sortOrder === opt.key
                      ? 'bg-[#E5DAC4] text-[#14233F]'
                      : 'text-[#6E5D4B] hover:bg-[#FAF5E6] hover:text-[#14233F]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách bình luận */}
          <div className="mt-4 space-y-4 pb-2">
            {isLoadingComments ? (
              <div className="space-y-3 py-4">
                {[1, 2].map((skeleton) => (
                  <div key={skeleton} className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-[#E5DAC4]" />
                    <div className="h-16 flex-1 rounded-[12px] bg-[#EFE5D2]" />
                  </div>
                ))}
              </div>
            ) : sortedComments.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-6 text-center text-[14px] text-[#6E5D4B]">
                Chưa có bình luận nào. Hãy mở đầu cuộc thảo luận về chủ đề này!
              </div>
            ) : (
              sortedComments.map((comment) => renderCommentNode(comment))
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* 3. Thanh nhập bình luận cố định ở đáy Popup (giống hệt thanh viết bình luận cuối Popup Facebook) */}
        <footer className="shrink-0 bg-[#F1E6D0] px-4 py-3 md:px-6">
          {replyingTo ? (
            <div className="mb-2 flex items-center justify-between rounded-[6px] border border-[#D8C8AA] bg-[#FAF5E6] px-3 py-1.5 text-[12px] text-[#5C4E3C]">
              <span className="inline-flex items-center gap-1.5">
                <CornerDownRight size={13} className="text-[#7A1F24]" />
                <span>
                  Đang phản hồi bình luận của{' '}
                  <strong className="text-[#14233F]">{replyingTo.authorName}</strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="font-semibold text-[#7A1F24] hover:underline"
              >
                Hủy
              </button>
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <div
              style={{ backgroundColor: currentUserTint.bg, color: currentUserTint.ink }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
            >
              {getInitials(currentUserName)}
            </div>

            <div className="flex flex-1 items-end gap-2 rounded-[18px] border border-[#D8C8AA] bg-[#FDF9F0] px-3.5 py-2 focus-within:border-[#8A5A19]">
              <textarea
                ref={inputRef}
                rows={1}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmitComment();
                  }
                }}
                placeholder={
                  replyingTo
                    ? `Viết phản hồi gửi tới ${replyingTo.authorName}...`
                    : `Viết bình luận dưới tên ${currentUserName}... (Nhấn Enter để gửi)`
                }
                aria-label="Nhập nội dung bình luận"
                className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-[#14233F] placeholder:text-[#8A7963] outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSubmitComment()}
                disabled={!composerText.trim()}
                aria-label="Gửi bình luận"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7A1F24] text-[#FAF5E6] transition-opacity hover:bg-[#651A1E] disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
