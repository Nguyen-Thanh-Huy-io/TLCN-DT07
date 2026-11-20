import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GamificationEventName } from '../gamification/gamification.constant';
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

  it('list trả danh sách rút gọn kèm đếm node/edge từ graph đã lưu', async () => {
    mockPrisma.studyMindmap.findMany.mockResolvedValue([
      {
        id: 'mm-1',
        title: 'Nhà Lý',
        periodLabel: '1009 – 1225',
        template: MindmapTemplateType.TREE,
        graph: { nodes: [{ id: 'n1' }, { id: 'n2' }], edges: [{ id: 'e1' }] },
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      },
      {
        id: 'mm-2',
        title: 'Sơ đồ trống',
        periodLabel: null,
        template: MindmapTemplateType.BLANK,
        graph: null,
        createdAt: new Date('2026-01-03'),
        updatedAt: new Date('2026-01-03'),
      },
    ]);

    const res = await service.list('user-1');

    expect(mockPrisma.studyMindmap.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'user-1' },
      orderBy: { updatedAt: 'desc' },
    });
    expect(res).toEqual([
      expect.objectContaining({ id: 'mm-1', nodeCount: 2, edgeCount: 1 }),
      expect.objectContaining({ id: 'mm-2', nodeCount: 0, edgeCount: 0 }),
    ]);
  });

  it('create dùng graph truyền sẵn thay vì dựng từ template, và bắn sự kiện gamification', async () => {
    const emit = jest.fn();
    service = new MindmapService(mockPrisma, registry, {
      emit,
    } as any);
    const customGraph = { nodes: [{ id: 'n-root' }], edges: [] };

    const res = await service.create('user-1', {
      title: 'Sơ đồ tự vẽ',
      graph: customGraph as any,
    });

    expect(res.graph).toEqual(customGraph);
    expect(emit).toHaveBeenCalledWith(
      GamificationEventName.MINDMAP_CREATED,
      expect.objectContaining({ userId: 'user-1', mindmapId: 'mm-1' }),
    );
  });

  it('create báo BadRequestException khi đã đạt giới hạn số sơ đồ', async () => {
    mockPrisma.studyMindmap.count.mockResolvedValue(100);

    await expect(
      service.create('user-1', { title: 'Sơ đồ thừa' }),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.studyMindmap.create).not.toHaveBeenCalled();
  });

  it('update chỉ ghi các trường có truyền, bỏ qua trường undefined', async () => {
    mockPrisma.studyMindmap.findFirst.mockResolvedValue({ id: 'mm-1' });

    await service.update('user-1', 'mm-1', { title: 'Tên mới' });

    expect(mockPrisma.studyMindmap.update).toHaveBeenCalledWith({
      where: { id: 'mm-1' },
      data: { title: 'Tên mới' },
    });
  });

  it('update báo NotFoundException nếu sơ đồ không thuộc owner', async () => {
    mockPrisma.studyMindmap.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', 'mm-x', { title: 'X' }),
    ).rejects.toThrow(NotFoundException);
    expect(mockPrisma.studyMindmap.update).not.toHaveBeenCalled();
  });

  it('remove xoá sơ đồ sau khi xác nhận thuộc owner', async () => {
    mockPrisma.studyMindmap.findFirst.mockResolvedValue({ id: 'mm-1' });

    const res = await service.remove('user-1', 'mm-1');

    expect(mockPrisma.studyMindmap.delete).toHaveBeenCalledWith({
      where: { id: 'mm-1' },
    });
    expect(res).toEqual({ deleted: true });
  });
});
