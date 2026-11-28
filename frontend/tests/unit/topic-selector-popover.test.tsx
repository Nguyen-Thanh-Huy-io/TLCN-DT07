import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TopicSelectorPopover,
  type EnrichedTopicItem,
} from '@/features/public-curriculum/components/TopicSelectorPopover';

const mockTopics: EnrichedTopicItem[] = [
  {
    id: 'topic-1',
    name: 'Thời kỳ dựng nước Văn Lang - Âu Lạc',
    curriculumPathCount: 2,
    curriculumLessonCount: 5,
    eyebrow: 'Lịch sử Cổ đại',
  },
  {
    id: 'topic-2',
    name: 'Nghìn năm Bắc thuộc',
    curriculumPathCount: 1,
    curriculumLessonCount: 3,
  },
];

describe('TopicSelectorPopover Component', () => {
  it('hiển thị nút chọn chủ đề mặc định', () => {
    const handleSelect = vi.fn();
    render(
      <TopicSelectorPopover
        topics={mockTopics}
        selectedTopicId={null}
        onSelectTopic={handleSelect}
      />,
    );

    expect(screen.getByRole('button', { name: 'Chọn chủ đề lịch sử' })).toBeDefined();
    expect(screen.getByText('Tất cả chủ đề lịch sử')).toBeDefined();
  });

  it('mở danh sách chủ đề khi click vào nút bấm và hiển thị số lượng', () => {
    const handleSelect = vi.fn();
    render(
      <TopicSelectorPopover
        topics={mockTopics}
        selectedTopicId={null}
        onSelectTopic={handleSelect}
      />,
    );

    const button = screen.getByRole('button', { name: 'Chọn chủ đề lịch sử' });
    fireEvent.click(button);

    // Kiểm tra ô tìm kiếm nhanh
    expect(screen.getByPlaceholderText('Tìm nhanh chủ đề...')).toBeDefined();

    // Kiểm tra các item chủ đề và số liệu
    expect(screen.getByText('Thời kỳ dựng nước Văn Lang - Âu Lạc')).toBeDefined();
    expect(screen.getByText(/2 lộ trình/)).toBeDefined();
    expect(screen.getByText(/5 bài học/)).toBeDefined();
    expect(screen.getByText(/Lịch sử Cổ đại/)).toBeDefined();
  });

  it('lọc chủ đề theo từ khóa tìm kiếm trong popover', () => {
    const handleSelect = vi.fn();
    render(
      <TopicSelectorPopover
        topics={mockTopics}
        selectedTopicId={null}
        onSelectTopic={handleSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Chọn chủ đề lịch sử' }));

    const searchInput = screen.getByPlaceholderText('Tìm nhanh chủ đề...');
    fireEvent.change(searchInput, { target: { value: 'Bắc thuộc' } });

    expect(screen.queryByText('Thời kỳ dựng nước Văn Lang - Âu Lạc')).toBeNull();
    expect(screen.getByText('Nghìn năm Bắc thuộc')).toBeDefined();
  });

  it('gọi onSelectTopic và đóng popover khi người dùng chọn chủ đề', () => {
    const handleSelect = vi.fn();
    render(
      <TopicSelectorPopover
        topics={mockTopics}
        selectedTopicId={null}
        onSelectTopic={handleSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Chọn chủ đề lịch sử' }));
    fireEvent.click(screen.getByText('Thời kỳ dựng nước Văn Lang - Âu Lạc'));

    expect(handleSelect).toHaveBeenCalledWith('topic-1');
    // Sau khi chọn thì popover đóng lại, ô tìm kiếm không còn trong DOM
    expect(screen.queryByPlaceholderText('Tìm nhanh chủ đề...')).toBeNull();
  });

  it('cho phép chọn lại "Tất cả chủ đề lịch sử" để xóa lọc', () => {
    const handleSelect = vi.fn();
    render(
      <TopicSelectorPopover
        topics={mockTopics}
        selectedTopicId="topic-1"
        onSelectTopic={handleSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Chọn chủ đề lịch sử' }));

    // Khi đã chọn topic-1, nút trigger mang tên topic-1, trong popover có nút "Tất cả chủ đề lịch sử"
    const allOption = screen.getByText('Tất cả chủ đề lịch sử');
    fireEvent.click(allOption);

    expect(handleSelect).toHaveBeenCalledWith(null);
  });
});
