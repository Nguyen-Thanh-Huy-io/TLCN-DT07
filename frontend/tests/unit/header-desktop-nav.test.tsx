import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HeaderDesktopNav } from '@/components/hisgo/HeaderDesktopNav';
import { Swords } from 'lucide-react';
import type { ResolvedExploreCategory } from '@/components/hisgo/category-navigation.facade';

vi.mock('next/navigation', () => ({
  usePathname: () => '/chuong-trinh-hoc',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockCategories: ResolvedExploreCategory[] = [
  {
    id: 'cat-1',
    name: 'Sự kiện',
    slug: 'su-kien',
    href: '/chuyen-muc/su-kien',
    icon: Swords,
    description: 'Sự kiện lịch sử',
  },
];

describe('HeaderDesktopNav Component', () => {
  it('render đủ 4 trụ cột: Học tập, Dòng thời gian, Khám phá, Cộng đồng', () => {
    render(<HeaderDesktopNav dynamicCategories={mockCategories} />);

    expect(screen.getByRole('button', { name: /học tập/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dòng thời gian/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /khám phá/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cộng đồng/i })).toBeInTheDocument();
  });

  it('mở dropdown Học tập khi nhấp vào nút Học tập', () => {
    render(<HeaderDesktopNav dynamicCategories={mockCategories} />);

    const learningBtn = screen.getByRole('button', { name: /học tập/i });
    fireEvent.click(learningBtn);

    expect(screen.getByText('Chương trình học')).toBeInTheDocument();
    expect(screen.getByText('Luyện tập trắc nghiệm')).toBeInTheDocument();
  });

  it('mở dropdown Cộng đồng khi nhấp vào nút Cộng đồng', () => {
    render(<HeaderDesktopNav dynamicCategories={mockCategories} />);

    const communityBtn = screen.getByRole('button', { name: /cộng đồng/i });
    fireEvent.click(communityBtn);

    expect(screen.getByText('Diễn đàn thảo luận')).toBeInTheDocument();
    expect(screen.getByText('Góc nhìn & Blog')).toBeInTheDocument();
  });

  it('mở dropdown Khám phá và hiển thị chuyên mục động từ DB', () => {
    render(<HeaderDesktopNav dynamicCategories={mockCategories} />);

    const exploreBtn = screen.getByRole('button', { name: /khám phá/i });
    fireEvent.click(exploreBtn);

    expect(screen.getByText('Bản đồ Khái niệm AI')).toBeInTheDocument();
    expect(screen.getByText('Sự kiện')).toBeInTheDocument();
  });
});
