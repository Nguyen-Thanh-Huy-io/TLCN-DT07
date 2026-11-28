import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HorizontalTimelineRuler } from '@/components/timeline/HorizontalTimelineRuler';
import type { SubEra, TimeNode } from '@/components/timeline/sk-adapter';

const mockTimeNodes: TimeNode[] = [
  {
    id: 'node-1',
    subEraId: 'sub-1',
    dateLabel: '2500000 TCN',
    sortYear: -2500000,
    events: [
      {
        id: 'ev-1',
        title: 'Người vượn tối cổ',
        summary: 'Dấu tích sơ khai của loài người',
        category: 'Khảo cổ',
        categoryCode: 'khao-co',
        tags: [],
        dateLabel: '2500000 TCN',
        imageUrl: '/images/ancient-man.jpg',
      },
    ],
  },
  {
    id: 'node-2',
    subEraId: 'sub-1',
    dateLabel: '1000 TCN',
    sortYear: -1000,
    events: [
      {
        id: 'ev-2',
        title: 'Văn hóa Đông Sơn',
        summary: 'Thời kỳ đồ đồng cực thịnh',
        category: 'Văn hóa',
        categoryCode: 'van-hoa',
        tags: [],
        dateLabel: '1000 TCN',
      },
    ],
  },
];

const mockSubEras: SubEra[] = [
  {
    id: 'sub-1',
    eraId: 'era-1',
    title: 'Thời kỳ Tiền sử',
    slug: 'tien-su',
    periodLabel: 'Hàng triệu năm trước',
    summary: 'Giai đoạn mở đầu lịch sử nhân loại',
    themeColor: 'stone',
    timeNodes: mockTimeNodes,
  },
];

describe('HorizontalTimelineRuler Component', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('render đầy đủ các mốc lịch sử với định dạng thời gian chuẩn hóa và thumbnail', () => {
    const onSelectNode = vi.fn();
    render(
      <HorizontalTimelineRuler
        visibleNodes={mockTimeNodes}
        selectedNode={mockTimeNodes[0]}
        onSelectNode={onSelectNode}
        subs={mockSubEras}
        onDetail={vi.fn()}
        onSave={vi.fn()}
        saved={[]}
      />,
    );

    // Kiểm tra định dạng thời gian tiếng Việt (có thể xuất hiện ở card và panel)
    expect(screen.getAllByText('Khoảng 2,5 triệu năm TCN').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1.000 TCN')).toBeInTheDocument();
    // Tiêu đề sự kiện (xuất hiện ở thẻ thước và trong panel chi tiết bên dưới)
    expect(screen.getAllByText('Người vượn tối cổ').length).toBeGreaterThanOrEqual(1);
    // Nhãn giai đoạn hiển thị ở header thước và badge
    expect(screen.getAllByText('Thời kỳ Tiền sử').length).toBeGreaterThanOrEqual(1);
  });

  it('gọi callback onSelectNode khi click vào nút mốc thời gian', () => {
    const onSelectNode = vi.fn();
    render(
      <HorizontalTimelineRuler
        visibleNodes={mockTimeNodes}
        selectedNode={mockTimeNodes[0]}
        onSelectNode={onSelectNode}
        subs={mockSubEras}
        onDetail={vi.fn()}
        onSave={vi.fn()}
        saved={[]}
      />,
    );

    const secondNodeBtn = screen.getByTitle(/1.000 TCN - Văn hóa Đông Sơn/);
    fireEvent.click(secondNodeBtn);

    expect(onSelectNode).toHaveBeenCalledWith('node-2');
  });

  it('gọi onSelectNode khi nhấn nút Sau trên toolbar', () => {
    const onSelectNode = vi.fn();
    render(
      <HorizontalTimelineRuler
        visibleNodes={mockTimeNodes}
        selectedNode={mockTimeNodes[0]}
        onSelectNode={onSelectNode}
        subs={mockSubEras}
        onDetail={vi.fn()}
        onSave={vi.fn()}
        saved={[]}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: /Mốc tiếp theo trên thước/i });
    fireEvent.click(nextBtn);

    expect(onSelectNode).toHaveBeenCalledWith('node-2');
  });

  it('ảo hóa cửa sổ hiển thị khi danh sách lớn hơn 40 mốc để tránh nghẽn DOM/GPU', () => {
    const manyNodes: TimeNode[] = Array.from({ length: 120 }, (_, i) => ({
      id: `node-${i + 1}`,
      subEraId: 'sub-many',
      dateLabel: `${1800 + i}`,
      sortYear: 1800 + i,
      events: [
        {
          id: `ev-${i + 1}`,
          title: `Sự kiện năm ${1800 + i}`,
          summary: 'Mô tả',
          category: 'Sự kiện',
          categoryCode: 'su-kien',
          tags: [],
          dateLabel: `${1800 + i}`,
        },
      ],
    }));
    const manySubs: SubEra[] = [
      {
        id: 'sub-many',
        eraId: 'era-1',
        title: 'Thế kỷ XIX - XX',
        slug: 'the-ky-19-20',
        periodLabel: '1800 – 1919',
        summary: 'Giai đoạn cận đại',
        themeColor: 'stone',
        timeNodes: manyNodes,
      },
    ];

    render(
      <HorizontalTimelineRuler
        visibleNodes={manyNodes}
        selectedNode={manyNodes[0]}
        onSelectNode={vi.fn()}
        subs={manySubs}
        onDetail={vi.fn()}
        onSave={vi.fn()}
        saved={[]}
      />,
    );

    const renderedOptions = screen.getAllByRole('option');
    expect(renderedOptions.length).toBeLessThan(35);
    expect(screen.getAllByText('Mốc 1 / 120').length).toBeGreaterThanOrEqual(1);
  });
});
