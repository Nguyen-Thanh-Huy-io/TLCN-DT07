'use client';

import {
  GraduationCap,
  Target,
  Users,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { NavLinkId, NavigationPillarId } from '@/constants/enums';

export const PRACTICE_ROUTE = '/luyen-tap';

export interface NavigationSubItem {
  id: string;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavigationPillar {
  id: NavigationPillarId | NavLinkId;
  label: string;
  href?: string;
  subItems?: NavigationSubItem[];
  isDropdown?: boolean;
}

export const NAVIGATION_PILLARS: NavigationPillar[] = [
  {
    id: NavigationPillarId.LEARNING,
    label: 'Học tập',
    isDropdown: true,
    subItems: [
      {
        id: NavLinkId.CURRICULUM,
        label: 'Chương trình học',
        href: '/chuong-trinh-hoc',
        description: 'Lộ trình bài học theo khối lớp & chuyên đề',
        icon: GraduationCap,
      },
      {
        id: NavLinkId.QUIZ,
        label: 'Luyện tập trắc nghiệm',
        href: PRACTICE_ROUTE,
        description: 'Ngân hàng đề thi & câu hỏi ôn tập',
        icon: Target,
        badge: 'Ôn luyện',
      },
    ],
  },
  {
    id: NavigationPillarId.TIMELINE,
    label: 'Dòng thời gian',
    href: '/dong-thoi-gian',
  },
  {
    id: NavigationPillarId.COMMUNITY,
    label: 'Cộng đồng',
    isDropdown: true,
    subItems: [
      {
        id: NavLinkId.COMMUNITY,
        label: 'Diễn đàn thảo luận',
        href: '/cong-dong',
        description: 'Hỏi đáp & chia sẻ kiến thức cùng cộng đồng',
        icon: Users,
      },
      {
        id: NavLinkId.BLOG,
        label: 'Góc nhìn & Blog',
        href: '/blog',
        description: 'Bài viết chuyên sâu & góc phân tích sử liệu',
        icon: Newspaper,
      },
    ],
  },
];

export const MOBILE_HOME_LINK = {
  id: NavLinkId.EXPLORE,
  label: 'Trang chủ',
  href: '/',
};

export const DESKTOP_NAV_ACTIVE_CLS =
  'bg-white/20 text-[#FFF6E3] font-semibold shadow-inner border border-[#D4AE67]/40';
export const DESKTOP_NAV_IDLE_CLS =
  'text-[#F5EEDC]/85 hover:text-[#FFF6E3] hover:bg-white/10';

export function isLearningActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/chuong-trinh-hoc') ||
    pathname.startsWith('/bai-hoc') ||
    pathname.startsWith(PRACTICE_ROUTE) ||
    pathname.startsWith('/trac-nghiem')
  );
}

export function isTimelineActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/dong-thoi-gian') || pathname.startsWith('/giai-doan');
}

export function isCommunityActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/cong-dong') || pathname.startsWith('/blog');
}

export function isExploreActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/bai-viet') ||
    pathname.startsWith('/kham-pha-khai-niem') ||
    pathname.startsWith('/chuyen-muc') ||
    pathname.startsWith('/nhan-vat') ||
    pathname.startsWith('/su-kien') ||
    pathname.startsWith('/di-tich') ||
    pathname.startsWith('/thuc-the')
  );
}
