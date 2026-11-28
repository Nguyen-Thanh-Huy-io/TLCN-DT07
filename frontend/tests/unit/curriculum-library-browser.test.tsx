import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurriculumLibraryBrowser } from '@/features/public-curriculum/components/CurriculumLibraryBrowser';
import type { LibraryLesson } from '@/services/entities/learner.service';

const mockTags = [
  { id: 'tag-1', name: 'Hùng Vương' },
  { id: 'tag-2', name: 'Văn Lang' },
  { id: 'tag-3', name: 'Đông Sơn' },
  { id: 'tag-4', name: 'Điêu khắc gỗ' },
  { id: 'tag-5', name: 'Đình làng' },
  { id: 'tag-6', name: 'Di sản' },
];

const mockLessons: LibraryLesson[] = [
  {
    id: 'l-1',
    title: 'Bài 1: Khởi nguồn thời đại Hùng Vương',
    slug: 'bai-1-hung-vuong',
    description: 'Tìm hiểu cội nguồn',
    estimatedReadMinutes: 5,
    difficulty: 'EASY',
    status: 'PUBLISHED',
    tags: [mockTags[0], mockTags[1]],
  },
];

describe('CurriculumLibraryBrowser Component', () => {
  it('render dải thẻ từ khóa gọn gàng và xử lý chọn thẻ', () => {
    const handleSelectTag = vi.fn();
    render(
      <CurriculumLibraryBrowser
        lessons={mockLessons}
        availableTags={mockTags}
        selectedTagId={null}
        onSelectTag={handleSelectTag}
        isCompleted={() => false}
      />,
    );

    expect(screen.getByText('Thẻ từ khóa:')).toBeDefined();
    expect(screen.getByText('Tất cả thẻ')).toBeDefined();
    expect(screen.getByText('Hùng Vương')).toBeDefined();
    expect(screen.getByText('Xem tất cả (6)')).toBeDefined();

    // Bấm chọn một tag trên dải cuộn ngang
    fireEvent.click(screen.getByText('Hùng Vương'));
    expect(handleSelectTag).toHaveBeenCalledWith('tag-1');
  });

  it('mở modal tìm kiếm thẻ khi bấm Xem tất cả', () => {
    const handleSelectTag = vi.fn();
    render(
      <CurriculumLibraryBrowser
        lessons={mockLessons}
        availableTags={mockTags}
        selectedTagId="tag-2"
        onSelectTag={handleSelectTag}
        isCompleted={() => false}
      />,
    );

    const openModalBtn = screen.getByText('Xem tất cả (6)');
    fireEvent.click(openModalBtn);

    // Kiểm tra modal đã mở với tiêu đề và ô tìm kiếm
    expect(screen.getByText('Tất cả thẻ từ khóa (6)')).toBeDefined();
    expect(screen.getByPlaceholderText(/Tìm kiếm thẻ/)).toBeDefined();

    // Thử gõ tìm kiếm trong modal
    const input = screen.getByPlaceholderText(/Tìm kiếm thẻ/);
    fireEvent.change(input, { target: { value: 'Điêu khắc' } });
    const matches = screen.getAllByText('Điêu khắc gỗ');
    expect(matches.length).toBeGreaterThanOrEqual(1);

    // Bấm chọn thẻ từ trong modal (phần tử cuối nằm trong modal)
    fireEvent.click(matches[matches.length - 1]);
    expect(handleSelectTag).toHaveBeenCalledWith('tag-4');
  });
});
