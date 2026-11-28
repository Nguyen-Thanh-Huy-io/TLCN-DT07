import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CurriculumNavigationTabs,
  CURRICULUM_TAB_KEYS,
} from '@/features/public-curriculum/components/CurriculumNavigationTabs';

describe('CurriculumNavigationTabs Component', () => {
  it('render đầy đủ 3 phân khu: Mạch tiến trình cốt lõi, Chuyên đề chuyên sâu, Thư viện bài học', () => {
    const handleTabChange = vi.fn();
    render(
      <CurriculumNavigationTabs
        activeTab={CURRICULUM_TAB_KEYS.CORE_TRACKS}
        onTabChange={handleTabChange}
        counts={{ coreTracks: 3, thematic: 1, library: 9 }}
      />,
    );

    expect(screen.getByText('Mạch tiến trình cốt lõi')).toBeDefined();
    expect(screen.getByText('Chuyên đề chuyên sâu')).toBeDefined();
    expect(screen.getByText('Thư viện bài học')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('9')).toBeDefined();
  });

  it('gọi onTabChange khi người dùng nhấp chọn tab khác', () => {
    const handleTabChange = vi.fn();
    render(
      <CurriculumNavigationTabs
        activeTab={CURRICULUM_TAB_KEYS.CORE_TRACKS}
        onTabChange={handleTabChange}
        counts={{ coreTracks: 3, thematic: 1, library: 9 }}
      />,
    );

    const thematicBtn = screen.getByText('Chuyên đề chuyên sâu').closest('button');
    expect(thematicBtn).not.toBeNull();
    fireEvent.click(thematicBtn!);

    expect(handleTabChange).toHaveBeenCalledWith(CURRICULUM_TAB_KEYS.THEMATIC);
  });
});
