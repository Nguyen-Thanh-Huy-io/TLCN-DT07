import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurriculumFilterBar } from '@/features/public-curriculum/components/CurriculumFilterBar';
import type { TopicItem } from '@/types/models';

const mockTopics: TopicItem[] = [
  {
    id: 'topic-1',
    name: 'Thời kỳ dựng nước Văn Lang - Âu Lạc',
    slug: 'thoi-ky-dung-nuoc',
    description: null,
    parentId: null,
    displayOrder: 1,
    status: 'PUBLISHED',
  },
  {
    id: 'topic-2',
    name: 'Nghìn năm Bắc thuộc',
    slug: 'nghin-nam-bac-thuoc',
    description: null,
    parentId: null,
    displayOrder: 2,
    status: 'PUBLISHED',
  },
];

describe('CurriculumFilterBar Component', () => {
  it('render ô tìm kiếm và dropdown popover chọn chủ đề lịch sử', () => {
    const handleSearchChange = vi.fn();
    const handleSelectTopic = vi.fn();

    render(
      <CurriculumFilterBar
        searchKeyword=""
        onSearchChange={handleSearchChange}
        topics={mockTopics}
        selectedTopicId={null}
        onSelectTopic={handleSelectTopic}
        resultCount={4}
      />,
    );

    expect(screen.getByPlaceholderText('Tìm theo tên lộ trình, chương, bài học...')).toBeDefined();
    expect(screen.getByLabelText('Chọn chủ đề lịch sử')).toBeDefined();
    expect(screen.getByText('Tất cả chủ đề lịch sử')).toBeDefined();
  });

  it('gọi onSelectTopic khi người dùng mở popover và chọn chủ đề', () => {
    const handleSearchChange = vi.fn();
    const handleSelectTopic = vi.fn();

    render(
      <CurriculumFilterBar
        searchKeyword=""
        onSearchChange={handleSearchChange}
        topics={mockTopics}
        selectedTopicId={null}
        onSelectTopic={handleSelectTopic}
      />,
    );

    const button = screen.getByLabelText('Chọn chủ đề lịch sử');
    fireEvent.click(button);

    const topicItem = screen.getByText('Thời kỳ dựng nước Văn Lang - Âu Lạc');
    fireEvent.click(topicItem);

    expect(handleSelectTopic).toHaveBeenCalledWith('topic-1');
  });

  it('hiển thị badge trạng thái đang lọc và nút xóa bộ lọc', () => {
    const handleSearchChange = vi.fn();
    const handleSelectTopic = vi.fn();

    render(
      <CurriculumFilterBar
        searchKeyword="Hùng Vương"
        onSearchChange={handleSearchChange}
        topics={mockTopics}
        selectedTopicId="topic-1"
        onSelectTopic={handleSelectTopic}
        resultCount={1}
      />,
    );

    expect(screen.getByText('Chủ đề: Thời kỳ dựng nước Văn Lang - Âu Lạc')).toBeDefined();
    expect(screen.getByText('Từ khóa: "Hùng Vương"')).toBeDefined();
    expect(screen.getByText('Xóa bộ lọc')).toBeDefined();

    fireEvent.click(screen.getByText('Xóa bộ lọc'));
    expect(handleSearchChange).toHaveBeenCalledWith('');
    expect(handleSelectTopic).toHaveBeenCalledWith(null);
  });
});
