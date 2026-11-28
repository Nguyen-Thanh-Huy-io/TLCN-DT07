import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentStatus } from '@/constants/enums';
import { CurriculumTrackRoadmap } from '@/features/public-curriculum/components/CurriculumTrackRoadmap';
import type { LearningPathItem } from '@/services/entities/learner.service';

const mockPaths: LearningPathItem[] = [
  {
    id: 'path-a',
    title: 'Buổi đầu dựng nước: Thời đại Hùng Vương',
    slug: 'buoi-dau-dung-nuoc',
    description: 'Mở đầu thời kỳ Văn Lang - Âu Lạc',
    pathType: 'CHRONOLOGICAL',
    isSequential: true,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    prerequisitePathId: null,
    prerequisitePath: null,
    chapters: [
      {
        id: 'ch-1',
        learningPathId: 'path-a',
        title: 'Chương 1',
        slug: 'ch-1',
        displayOrder: 1,
        status: ContentStatus.PUBLISHED,
        chapterLessons: [
          {
            id: 'cl-1',
            chapterId: 'ch-1',
            lessonId: 'l-1',
            displayOrder: 1,
            lesson: {
              id: 'l-1',
              title: 'Bài 1: Nguồn gốc con Rồng cháu Tiên',
              slug: 'bai-1-nguon-goc',
              status: ContentStatus.PUBLISHED,
              topic: {
                id: 'topic-hung-vuong',
                name: 'Thời kỳ dựng nước Văn Lang - Âu Lạc',
                slug: 'thoi-ky-dung-nuoc',
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: 'path-b',
    title: 'Nghìn năm Bắc thuộc và đấu tranh',
    slug: 'nghin-nam-bac-thuoc',
    description: 'Các cuộc khởi nghĩa quật khởi',
    pathType: 'CHRONOLOGICAL',
    isSequential: true,
    displayOrder: 2,
    status: ContentStatus.PUBLISHED,
    prerequisitePathId: 'path-a',
    prerequisitePath: {
      id: 'path-a',
      title: 'Buổi đầu dựng nước: Thời đại Hùng Vương',
      slug: 'buoi-dau-dung-nuoc',
    },
    chapters: [],
  },
];

describe('CurriculumTrackRoadmap Component', () => {
  it('render các chặng theo chuỗi và hiển thị điều kiện tiên quyết', () => {
    const handleSelectPath = vi.fn();
    const handleEnroll = vi.fn().mockResolvedValue(undefined);

    render(
      <CurriculumTrackRoadmap
        paths={mockPaths}
        selectedPathId="path-a"
        onSelectPath={handleSelectPath}
        isCompleted={(id) => id === 'l-1'}
        isEnrolled={(id) => id === 'path-a'}
        onEnroll={handleEnroll}
        loggedIn={true}
      />,
    );

    expect(screen.getAllByText('Buổi đầu dựng nước: Thời đại Hùng Vương').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Nghìn năm Bắc thuộc và đấu tranh')).toBeDefined();
    expect(screen.getByText('Chặng 01')).toBeDefined();
    expect(screen.getByText('Chặng 02')).toBeDefined();
    expect(screen.getByText(/Kế thừa từ:/)).toBeDefined();
    expect(screen.getByText('Thời kỳ dựng nước Văn Lang - Âu Lạc')).toBeDefined();
  });

  it('gọi onSelectPath khi người dùng bấm xem đề cương', () => {
    const handleSelectPath = vi.fn();
    const handleEnroll = vi.fn().mockResolvedValue(undefined);

    render(
      <CurriculumTrackRoadmap
        paths={mockPaths}
        selectedPathId={null}
        onSelectPath={handleSelectPath}
        isCompleted={() => false}
        isEnrolled={() => false}
        onEnroll={handleEnroll}
        loggedIn={true}
      />,
    );

    const buttons = screen.getAllByText('Xem đề cương');
    fireEvent.click(buttons[0]);

    expect(handleSelectPath).toHaveBeenCalledWith(mockPaths[0]);
  });
});
