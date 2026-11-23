import { BadRequestException } from '@nestjs/common';
import config from '../common/config/app.config';
import { MindmapAiService } from './mindmap-ai.service';
import {
  MindmapAiEngine,
  MindmapBranchColor,
  MindmapStructure,
} from './mindmap.constant';

describe('MindmapAiService', () => {
  let service: MindmapAiService;
  let mockPrisma: {
    note: { findMany: jest.Mock };
    article: { findMany: jest.Mock };
  };

  beforeEach(() => {
    config.gemini_api_key = '';
    mockPrisma = {
      note: { findMany: jest.fn().mockResolvedValue([]) },
      article: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new MindmapAiService(mockPrisma as never);
  });

  it('ném BadRequestException khi không có prompt lẫn nguồn dữ liệu nào', async () => {
    await expect(
      service.generatePreview('user-1', {
        includeNotes: false,
        articleIds: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('dựng sơ đồ phân cấp 3 tầng bằng Heuristic từ prompt ("Bạn muốn xây dựng cái gì?") ngay cả khi DB chưa có dữ liệu', async () => {
    const res = await service.generatePreview('user-1', {
      prompt:
        'Khởi nghĩa Lam Sơn (1418–1427): Bối cảnh nhà Minh đô hộ; Lê Lợi dựng cờ tại Lam Sơn; Chiến thắng Chi Lăng - Xương Giang.',
      structure: MindmapStructure.LOGIC_CHART,
      includeNotes: false,
    });

    expect(res.engine).toBe(MindmapAiEngine.HEURISTIC);
    expect(res.title).toContain('Khởi nghĩa Lam Sơn');
    expect(res.graph.structure).toBe(MindmapStructure.LOGIC_CHART);
    expect(res.graph.nodes[0].id).toBe('n-root');
    expect(res.graph.nodes.length).toBeGreaterThanOrEqual(9);
    expect(res.graph.edges.length).toBeGreaterThanOrEqual(8);
  });

  it('kết hợp bài viết đã lưu (kèm articleRef) và ghi chú cá nhân vào sơ đồ', async () => {
    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-1',
        slug: 'nha-tran',
        title: 'Vương triều Nhà Trần',
        summary: 'Ba lần đánh thắng quân Nguyên - Mông.',
        dateText: '1225 – 1400',
        contentBlocks: [{ type: 'HEADING', text: 'Hội nghị Diên Hồng' }],
      },
    ]);
    mockPrisma.note.findMany.mockResolvedValue([
      {
        id: 'note-1',
        title: 'Hịch tướng sĩ',
        content: 'Trần Quốc Tuấn soạn để khích lệ tướng sĩ.',
        highlightText: 'Hịch tướng sĩ',
      },
    ]);

    const res = await service.generatePreview('user-1', {
      includeNotes: true,
      articleIds: ['11111111-1111-4111-8111-111111111111'],
    });

    expect(res.engine).toBe(MindmapAiEngine.HEURISTIC);
    expect(res.articleCount).toBe(1);
    expect(res.noteCount).toBe(1);
    expect(res.graph.nodes.some((n) => n.articleRef?.slug === 'nha-tran')).toBe(
      true,
    );
  });

  it('gọi Gemini Flash khi có gemini_api_key và gắn articleRef nếu khớp bài viết', async () => {
    config.gemini_api_key = 'test-gemini-key';
    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-dbp',
        slug: 'chien-dich-dien-bien-phu',
        title: 'Chiến dịch Điện Biên Phủ',
        summary: 'Lừng lẫy năm châu, chấn động địa cầu.',
        dateText: '1954',
        contentBlocks: [],
      },
    ]);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'Chiến dịch Điện Biên Phủ 1954',
                    periodLabel: '13/3 – 7/5/1954',
                    nodes: [
                      {
                        id: 'n-root',
                        x: 420,
                        y: 240,
                        title: 'Chiến dịch Điện Biên Phủ',
                        color: MindmapBranchColor.CRIMSON,
                      },
                      {
                        id: 'n-1',
                        x: 700,
                        y: 180,
                        title: '3 đợt tiến công',
                        note: 'Đánh chắc, tiến chắc',
                        color: MindmapBranchColor.GOLD,
                      },
                    ],
                    edges: [{ id: 'e-1', fromId: 'n-root', toId: 'n-1' }],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const res = await service.generatePreview('user-1', {
      prompt: 'Chiến dịch Điện Biên Phủ',
    });

    expect(res.engine).toBe(MindmapAiEngine.GEMINI_FLASH);
    expect(res.title).toBe('Chiến dịch Điện Biên Phủ 1954');
    expect(res.graph.nodes).toHaveLength(2);
    expect(res.graph.nodes[0].articleRef?.slug).toBe(
      'chien-dich-dien-bien-phu',
    );
    fetchSpy.mockRestore();
  });

  it('bảo toàn các node người học đã tự soạn trên Canvas và nối tiếp nhánh mới khi truyền existingGraph', async () => {
    const existingGraph = {
      nodes: [
        {
          id: 'n-root',
          x: 420,
          y: 240,
          title: 'Nhà Trần (1225–1400)',
          color: MindmapBranchColor.CRIMSON,
        },
        {
          id: 'n-user-1',
          x: 680,
          y: 160,
          title: 'Kháng chiến lần 1 (1258)',
          color: MindmapBranchColor.GOLD,
        },
      ],
      edges: [{ id: 'e-u1', fromId: 'n-root', toId: 'n-user-1' }],
    };

    const res = await service.generatePreview('user-1', {
      prompt: 'Bổ sung diễn biến trận Đông Bộ Đầu và kết quả thắng lợi',
      existingGraph,
      selectedNodeId: 'n-user-1',
    });

    // Giữ nguyên 100% node gốc và nhánh người dùng đã tự soạn
    expect(res.title).toBe('Nhà Trần (1225–1400)');
    expect(
      res.graph.nodes.some(
        (n) => n.id === 'n-user-1' && n.title === 'Kháng chiến lần 1 (1258)',
      ),
    ).toBe(true);
    // Đã sinh thêm các nhánh con mới nối trực tiếp vào node đang chọn 'n-user-1'
    expect(res.graph.edges.some((e) => e.fromId === 'n-user-1')).toBe(true);
    expect(res.graph.nodes.length).toBeGreaterThan(2);
  });
});
