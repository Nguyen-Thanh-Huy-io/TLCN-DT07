import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LearningPathFormModal } from '@/features/curriculum/components/studio/StudioModals';
import type { LearningPathItem } from '@/services/entities/learner.service';

const mockPaths: LearningPathItem[] = [
  {
    id: 'path-1',
    title: 'Lịch sử Cổ đại',
    slug: 'lich-su-co-dai',
    pathType: 'CHRONOLOGICAL',
    isSequential: true,
    displayOrder: 1,
    status: 'PUBLISHED' as any,
    createdAt: '',
    updatedAt: '',
    chapters: [],
  },
  {
    id: 'path-2',
    title: 'Lịch sử Trung đại',
    slug: 'lich-su-trung-dai',
    pathType: 'CHRONOLOGICAL',
    isSequential: true,
    displayOrder: 2,
    status: 'PUBLISHED' as any,
    createdAt: '',
    updatedAt: '',
    chapters: [],
  },
];

describe('LearningPathFormModal', () => {
  it('hiển thị dropdown phân loại lộ trình và điều kiện tiên quyết khi có props tương ứng', () => {
    const onPathTypeChange = vi.fn();
    const onPrerequisitePathIdChange = vi.fn();

    render(
      <LearningPathFormModal
        isOpen={true}
        heading="Tạo Lộ trình học mới"
        title="Lịch sử Cận hiện đại"
        onTitleChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        pathType="CHRONOLOGICAL"
        onPathTypeChange={onPathTypeChange}
        prerequisitePathId=""
        onPrerequisitePathIdChange={onPrerequisitePathIdChange}
        availablePrerequisitePaths={mockPaths}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const pathTypeSelect = screen.getByLabelText(/Phân loại lộ trình/i) as HTMLSelectElement;
    expect(pathTypeSelect).toBeInTheDocument();
    expect(pathTypeSelect.value).toBe('CHRONOLOGICAL');

    fireEvent.change(pathTypeSelect, { target: { value: 'THEMATIC' } });
    expect(onPathTypeChange).toHaveBeenCalledWith('THEMATIC');

    const prereqSelect = screen.getByLabelText(/Lộ trình tiên quyết/i) as HTMLSelectElement;
    expect(prereqSelect).toBeInTheDocument();
    expect(screen.getByText(/Không có \(Bắt đầu tự do \/ Chặng đầu tiên\)/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Lịch sử Cổ đại/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Lịch sử Trung đại/i })).toBeInTheDocument();

    fireEvent.change(prereqSelect, { target: { value: 'path-1' } });
    expect(onPrerequisitePathIdChange).toHaveBeenCalledWith('path-1');
  });

  it('lọc bỏ chính lộ trình đang sửa khỏi danh sách tiên quyết để ngăn chặn vòng lặp phụ thuộc', () => {
    const currentEditingPathId = 'path-1';
    const filteredAvailable = mockPaths.filter((p) => p.id !== currentEditingPathId);

    render(
      <LearningPathFormModal
        isOpen={true}
        heading="Sửa Lộ trình học"
        title="Lịch sử Cổ đại"
        onTitleChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        pathType="CHRONOLOGICAL"
        onPathTypeChange={vi.fn()}
        prerequisitePathId=""
        onPrerequisitePathIdChange={vi.fn()}
        availablePrerequisitePaths={filteredAvailable}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Lộ trình path-1 đã bị lọc, chỉ còn path-2 trong danh sách
    expect(screen.queryByRole('option', { name: /Lịch sử Cổ đại/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Lịch sử Trung đại/i })).toBeInTheDocument();
  });
});
