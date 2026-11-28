import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CurriculumTrackShowcase,
  type CurriculumTrackShowcaseProps,
} from '@/features/public-curriculum/components/CurriculumTrackShowcase';
import type { CurriculumTrackGroup } from '@/features/public-curriculum/utils/curriculum-track.util';

const mockTracks: CurriculumTrackGroup[] = [
  {
    id: 'track-vn',
    title: 'Mạch tiến trình: Dòng chảy Lịch sử Việt Nam',
    description: 'Hành trình nghìn năm dựng nước và giữ nước.',
    coverImageUrl: '/assets/hero.jpg',
    paths: [
      { id: 'vn-1', title: 'Buổi đầu dựng nước' } as any,
      { id: 'vn-2', title: 'Nghìn năm Bắc thuộc' } as any,
    ],
    totalStages: 2,
    totalChapters: 4,
    totalLessons: 12,
    completedLessons: 6,
    progressPercent: 50,
    isCompleted: false,
    isEnrolled: true,
  },
  {
    id: 'track-world',
    title: 'Mạch tiến trình: Lịch sử Thế giới Cổ - Trung đại',
    description: 'Khám phá các nền văn minh nhân loại.',
    coverImageUrl: '/assets/temple.jpg',
    paths: [
      { id: 'w-1', title: 'Hy Lạp - La Mã' } as any,
    ],
    totalStages: 1,
    totalChapters: 2,
    totalLessons: 8,
    completedLessons: 0,
    progressPercent: 0,
    isCompleted: false,
    isEnrolled: false,
  },
];

describe('CurriculumTrackShowcase Component', () => {
  it('không render gì nếu danh sách tracks rỗng', () => {
    const { container } = render(
      <CurriculumTrackShowcase
        tracks={[]}
        selectedTrackId={null}
        onSelectTrack={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('render đầy đủ danh sách các thẻ mạch tiến trình và thanh pills', () => {
    const handleSelect = vi.fn();
    render(
      <CurriculumTrackShowcase
        tracks={mockTracks}
        selectedTrackId="track-vn"
        onSelectTrack={handleSelect}
      />,
    );

    // Tiêu đề
    expect(screen.getByText(/Mạch tiến trình \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('Mạch tiến trình: Dòng chảy Lịch sử Việt Nam')).toBeInTheDocument();
    expect(screen.getByText('Mạch tiến trình: Lịch sử Thế giới Cổ - Trung đại')).toBeInTheDocument();

    // Huy hiệu "Đang xem" cho mạch được chọn
    expect(screen.getByText('Đang xem')).toBeInTheDocument();

    // Chỉ số thống kê
    expect(screen.getByText('12 bài')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('8 bài')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('gọi onSelectTrack khi click vào thẻ mạch tiến trình', () => {
    const handleSelect = vi.fn();
    render(
      <CurriculumTrackShowcase
        tracks={mockTracks}
        selectedTrackId="track-vn"
        onSelectTrack={handleSelect}
      />,
    );

    const targetCard = screen.getByText('Mạch tiến trình: Lịch sử Thế giới Cổ - Trung đại');
    fireEvent.click(targetCard);

    expect(handleSelect).toHaveBeenCalledWith('track-world');
  });
});
