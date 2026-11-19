import { NotFoundException } from '@nestjs/common';
import { MindmapTemplateType } from './mindmap.constant';
import { MindmapTemplateRegistry } from './mindmap-template.strategy';
import { MindmapService } from './mindmap.service';

describe('MindmapService & MindmapTemplateRegistry', () => {
  let service: MindmapService;
  let mockPrisma: any;
  const registry = new MindmapTemplateRegistry();

  beforeEach(() => {
    mockPrisma = {
      studyMindmap: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(({ data }: any) =>
          Promise.resolve({ id: 'mm-1', ...data }),
        ),
        update: jest.fn(({ data }: any) =>
          Promise.resolve({ id: 'mm-1', ...data }),
        ),
        delete: jest.fn().mockResolvedValue({ id: 'mm-1' }),
      },
    };
    service = new MindmapService(mockPrisma, registry);
  });

  it('dựng đủ 5 mẫu sơ đồ Lịch sử (TREE, FLOW, SPIDER, DOUBLE_BUBBLE, BLANK)', () => {
    for (const tpl of Object.values(MindmapTemplateType)) {
      const graph = registry.buildGraph(tpl, 'Nhà Trần', '1225 – 1400');
      expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
    }
    const flow = registry.buildGraph(
      MindmapTemplateType.FLOW,
      'Cách mạng tháng Tám',
    );
    expect(flow.edges.some((e) => e.label === 'dẫn tới')).toBe(true);
    const bubble = registry.buildGraph(
      MindmapTemplateType.DOUBLE_BUBBLE,
      'So sánh',
    );
    expect(bubble.nodes.some((n) => n.title.includes('Điểm tương đồng'))).toBe(
      true,
    );
  });

  it('create tạo sơ đồ từ template khi không truyền graph sẵn', async () => {
    const res = await service.create('user-1', {
      title: 'Kháng chiến chống Tống',
      periodLabel: '1075 – 1077',
      template: MindmapTemplateType.TREE,
    });
    expect(mockPrisma.studyMindmap.create).toHaveBeenCalled();
    expect((res.graph as { nodes: unknown[] }).nodes).toHaveLength(5);
  });

  it('findOne báo NotFoundException nếu không thuộc owner', async () => {
    mockPrisma.studyMindmap.findFirst.mockResolvedValue(null);
    await expect(service.findOne('user-1', 'mm-x')).rejects.toThrow(
      NotFoundException,
    );
  });
});
