import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Calendar,
  Castle,
  Crown,
  Folder,
  GraduationCap,
  Landmark,
  MapPin,
  Network,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchCategories,
  type PublicCategory,
} from '@/services/public/public-content.service';

/**
 * Định nghĩa đường dẫn và nhãn tĩnh cho các công cụ khám phá cốt lõi
 */
export const EXPLORE_STATIC_ROUTES = {
  CONCEPT_MAP: '/kham-pha-khai-niem',
  ALL_ARTICLES: '/bai-viet',
  CATEGORY_FILTER_BASE: '/bai-viet?chuyen-muc=',
} as const;

export const EXPLORE_STATIC_LABELS = {
  CONCEPT_MAP: 'Bản đồ Khái niệm AI',
  CONCEPT_MAP_DESC: 'Mở rộng mạch liên kết lịch sử trên không gian 2D',
  CONCEPT_MAP_BADGE: 'AI',
  ALL_ARTICLES: 'Tất cả bài viết',
  ALL_ARTICLES_DESC: 'Toàn bộ kho bài viết & tư liệu lịch sử',
  ALL_ARTICLES_BADGE: 'Kho sử liệu',
  CATEGORY_SECTION_TITLE: 'Chuyên mục lịch sử',
} as const;

/**
 * Strategy/Factory map: Chuyển đổi chuỗi tên icon lưu trong CSDL sang LucideIcon component
 */
const CATEGORY_ICON_FACTORY: Record<string, LucideIcon> = {
  Swords,
  User,
  Landmark,
  Crown,
  ScrollText,
  BookOpen,
  Calendar,
  Castle,
  Shield,
  Trophy,
  Users,
  MapPin,
  GraduationCap,
  Sparkles,
  Network,
};

export function resolveCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Folder;
  const normalizedKey = iconName.trim();
  return CATEGORY_ICON_FACTORY[normalizedKey] ?? Folder;
}

export interface ResolvedExploreCategory {
  id: string;
  name: string;
  slug: string;
  href: string;
  description: string;
  icon: LucideIcon;
  articleCount?: number;
}

/**
 * Biến in-memory cache để giảm tải gọi API khi người dùng chuyển trang
 */
let cachedCategories: PublicCategory[] | null = null;
let categoryFetchPromise: Promise<PublicCategory[]> | null = null;

async function getCachedOrFetchCategories(): Promise<PublicCategory[]> {
  if (cachedCategories) return cachedCategories;
  if (!categoryFetchPromise) {
    categoryFetchPromise = fetchCategories()
      .then((data) => {
        cachedCategories = data;
        return data;
      })
      .catch((err) => {
        console.warn('Không thể tải chuyên mục từ database cho navigation:', err);
        return [];
      })
      .finally(() => {
        categoryFetchPromise = null;
      });
  }
  return categoryFetchPromise;
}

/**
 * Fallback mặc định khi offline hoặc DB chưa kịp phản hồi
 */
const DEFAULT_FALLBACK_CATEGORIES: ResolvedExploreCategory[] = [
  {
    id: 'fb-su-kien',
    name: 'Sự kiện lịch sử',
    slug: 'su-kien',
    href: `${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}su-kien`,
    description: 'Các trận đánh, biến cố và hiệp định',
    icon: Swords,
  },
  {
    id: 'fb-nhan-vat',
    name: 'Nhân vật lịch sử',
    slug: 'nhan-vat',
    href: `${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}nhan-vat`,
    description: 'Vua chúa, tướng lĩnh, anh hùng dân tộc',
    icon: User,
  },
  {
    id: 'fb-di-tich',
    name: 'Di tích & Địa danh',
    slug: 'di-tich',
    href: `${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}di-tich`,
    description: 'Chiến trường xưa, đền thờ, di sản',
    icon: Landmark,
  },
  {
    id: 'fb-trieu-dai',
    name: 'Triều đại lịch sử',
    slug: 'trieu-dai',
    href: `${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}trieu-dai`,
    description: 'Các vương triều và kỷ nguyên trị vì',
    icon: Crown,
  },
  {
    id: 'fb-tac-pham',
    name: 'Tác phẩm & Tư liệu',
    slug: 'tac-pham-tu-lieu',
    href: `${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}tac-pham-tu-lieu`,
    description: 'Tác phẩm văn học, quân sự và sử liệu',
    icon: ScrollText,
  },
];

export function mapCategoriesToResolvedExplore(
  categories: PublicCategory[],
): ResolvedExploreCategory[] {
  // Lọc chỉ lấy các chuyên mục gốc (parentId === null), sắp xếp theo displayOrder
  const roots = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (roots.length === 0) return DEFAULT_FALLBACK_CATEGORIES;

  return roots.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    href: `${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}${cat.slug}`,
    description: cat.description || `Các bài viết thuộc chuyên mục ${cat.name}`,
    icon: resolveCategoryIcon(cat.icon),
    articleCount: cat.articleCount,
  }));
}

/**
 * Custom Hook: Quản lý danh mục động cho Header & Navigation
 */
export function useNavigationCategories(
  initialCategories?: PublicCategory[],
): {
  categories: ResolvedExploreCategory[];
  loading: boolean;
} {
  const shouldInitialLoad =
    (!initialCategories || initialCategories.length === 0) &&
    (!cachedCategories || cachedCategories.length === 0);

  const [categories, setCategories] = useState<ResolvedExploreCategory[]>(() => {
    if (initialCategories && initialCategories.length > 0) {
      return mapCategoriesToResolvedExplore(initialCategories);
    }
    if (cachedCategories && cachedCategories.length > 0) {
      return mapCategoriesToResolvedExplore(cachedCategories);
    }
    return DEFAULT_FALLBACK_CATEGORIES;
  });
  const [loading, setLoading] = useState(shouldInitialLoad);

  useEffect(() => {
    let isMounted = true;
    if (initialCategories && initialCategories.length > 0) {
      cachedCategories = initialCategories;
      return;
    }
    if (cachedCategories && cachedCategories.length > 0) {
      return;
    }

    void getCachedOrFetchCategories().then((data) => {
      if (!isMounted) return;
      if (data && data.length > 0) {
        setCategories(mapCategoriesToResolvedExplore(data));
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [initialCategories]);

  return { categories, loading };
}
